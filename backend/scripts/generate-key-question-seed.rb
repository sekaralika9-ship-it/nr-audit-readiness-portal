#!/usr/bin/env ruby
# Converts the approved 2026 XLSX/DOCX sources into the deterministic seed used by the API.
require "json"
require "rexml/document"
require "tmpdir"

xlsx, docx, output = ARGV
abort "usage: generate-key-question-seed.rb MATRIX.xlsx QUESTIONS.docx OUTPUT.json" unless xlsx && docx && output

ALIASES = {
  "hc quality management" => "Human Capital & Quality Management",
  "human capital quality management" => "Human Capital & Quality Management",
  "asset integrity maintenance" => "Asset Integrity & Maintenance Management",
  "asset integrity maintenance management" => "Asset Integrity & Maintenance Management",
  "strategic planning performance" => "Strategic Planning Port & Performance",
  "strategic planning port performance" => "Strategic Planning Port & Performance"
}.freeze

CODES = {
  "HSSE" => "HSSE", "Procurement" => "PROC", "Human Capital & Quality Management" => "HCQM",
  "Audit Executive" => "AUDIT", "Information System & General Affair" => "ISGA",
  "Legal & Compliance" => "LEGAL", "Controller" => "CTRL", "Treasury" => "TRSY",
  "Corporate Secretary" => "CORSEC", "Asset Integrity & Maintenance Management" => "AIMM",
  "LNG Transportation & FSRU Operation" => "LNGOPS", "Gas Distribusi & Man. ORF" => "GASORF",
  "Commercial LNG & Gas" => "COMLNG", "Strategic Planning Port & Performance" => "SPP",
  "Risk Strategy & Governance" => "RSG", "Risk Implementation" => "RISKIMP",
  "Technical & Engineering" => "TECH", "Business Development" => "BDEV",
  "Tinjauan ORF Muara Karang & Rumah Singgah" => "LOCORF", "Tinjauan Warehouse Sunter" => "LOCWH",
  "Tinjauan Kantor Pusat (Wisma Nusantara)" => "LOCHQ", "Tinjauan Pos ISPS Green Bay Muara Karang" => "LOCISPS"
}.freeze

def token(value)
  value.to_s.downcase.gsub("&", " and ").gsub(/[^a-z0-9]+/, " ").strip.gsub(/\band\b/, " ").gsub(/\s+/, " ")
end

def canonical(value)
  ALIASES.fetch(token(value), value.to_s.strip)
end

def iso_clauses(reference)
  result = {}
  reference.to_s.scan(/ISO\s*(9001|14001|45001|37001|22301)(?::\d{4})?\s+Klausul\s+([^&;·]+)/i) do |standard, clause|
    result["ISO #{standard}"] = clause.strip.sub(/\s*\([^)]*\)\s*\z/, "")
  end
  result
end

rows = []
Dir.mktmpdir("nr-key-questions") do |dir|
  system("unzip", "-q", xlsx, "-d", dir) or abort "cannot unzip #{xlsx}"
  shared_doc = REXML::Document.new(File.read(File.join(dir, "xl/sharedStrings.xml")))
  shared = []
  REXML::XPath.each(shared_doc, '//*[local-name()="si"]') do |si|
    text = +""
    REXML::XPath.each(si, './/*[local-name()="t"]') { |node| text << node.text.to_s }
    shared << text
  end
  sheet = REXML::Document.new(File.read(File.join(dir, "xl/worksheets/sheet1.xml")))
  raw = []
  REXML::XPath.each(sheet, '//*[local-name()="row"]') do |row|
    values = {}
    REXML::XPath.each(row, './*[local-name()="c"]') do |cell|
      column = cell.attributes["r"].sub(/\d+/, "")
      value = REXML::XPath.first(cell, './*[local-name()="v"]')&.text
      values[column] = cell.attributes["t"] == "s" ? shared[value.to_i] : value
    end
    raw << values
  end
  raw.shift
  counts = Hash.new(0)
  raw.each do |item|
    function = canonical(item["A"])
    counts[function] += 1
    clauses = {}
    { "F" => "ISO 9001", "G" => "ISO 14001", "H" => "ISO 45001", "I" => "ISO 37001", "J" => "ISO 22301" }.each do |column, standard|
      clauses[standard] = item[column].strip if item[column] && !item[column].strip.empty? && item[column].strip != "-"
    end
    rows << {
      "questionKey" => format("KQ-%s-CORE-%02d", CODES.fetch(function), counts[function]),
      "functionName" => function, "normalizedFunctionName" => token(function), "locationName" => nil,
      "section" => "CORE", "questionText" => item["B"].to_s.strip, "auditType" => "Audit Execution Matrix",
      "reference" => nil, "auditTrail" => item["C"], "expectedEvidence" => item["D"],
      "samplingGuide" => item["E"], "isoClauses" => clauses, "displayOrder" => counts[function],
      "sourceDocument" => File.basename(xlsx)
    }
  end
end

doc_text = IO.popen(["textutil", "-convert", "txt", "-stdout", docx], &:read)
lines = doc_text.lines.map(&:strip).reject(&:empty?)
specific_counts = Hash.new(0)
current_name = current_type = nil
current_location = false
lines.each_with_index do |line, index|
  next_line = lines[index + 1].to_s
  if line.match?(/^\d+\.\s+/) && next_line.start_with?("Jenis Audit:")
    current_name = line.sub(/^\d+\.\s+/, "").strip
    current_location = current_name.start_with?("Tinjauan ")
    current_type = next_line.sub(/^Jenis Audit:\s*/, "").strip
    next
  end
  next unless current_name && line.match?(/^\d+\.\s+/) && next_line.start_with?("Referensi:")
  question = line.sub(/^\d+\.\s+/, "").strip
  reference = next_line.sub(/^Referensi:\s*/, "").strip
  canonical_name = current_location ? current_name : canonical(current_name)
  specific_counts[canonical_name] += 1
  rows << {
    "questionKey" => format("KQ-%s-SPECIFIC-%02d", CODES.fetch(canonical_name), specific_counts[canonical_name]),
    "functionName" => current_location ? nil : canonical_name,
    "normalizedFunctionName" => current_location ? nil : token(canonical_name),
    "locationName" => current_location ? canonical_name : nil, "section" => "SPECIFIC",
    "questionText" => question, "auditType" => current_type, "reference" => reference,
    "auditTrail" => nil, "expectedEvidence" => nil, "samplingGuide" => nil,
    "isoClauses" => iso_clauses(reference), "displayOrder" => specific_counts[canonical_name],
    "sourceDocument" => File.basename(docx)
  }
end

File.write(output, JSON.pretty_generate(rows) + "\n")
warn "generated #{rows.count { |r| r["section"] == "CORE" }} core and #{rows.count { |r| r["section"] == "SPECIFIC" }} specific/location questions"
