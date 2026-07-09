import { supabase } from "../lib/supabaseClient";

// Fetch audit themes
export async function getAuditThemes() {
  const { data, error } = await supabase
    .from("audit_master_themes")
    .select("*")
    .order("theme_id", { ascending: true });

  if (error) {
    throw new Error(`Error fetching audit themes: ${error.message}`);
  }
  return data;
}

// Fetch all audit questions
export async function getAuditQuestions() {
  const { data, error } = await supabase
    .from("audit_master_questions")
    .select("*")
    .order("question_key", { ascending: true });

  if (error) {
    throw new Error(`Error fetching audit questions: ${error.message}`);
  }
  return data;
}

// Fetch audit questions by theme
export async function getAuditQuestionsByTheme(themeCode) {
  const { data, error } = await supabase
    .from("audit_master_questions")
    .select("*")
    .eq("theme_code", themeCode)
    .order("question_key", { ascending: true });

  if (error) {
    throw new Error(`Error fetching audit questions by theme: ${error.message}`);
  }
  return data;
}

// Fetch ISO coverage
export async function getIsoCoverage() {
  const { data, error } = await supabase
    .from("audit_master_iso_coverage")
    .select("*")
    .order("clause", { ascending: true });

  if (error) {
    throw new Error(`Error fetching ISO coverage: ${error.message}`);
  }
  return data;
}

// Fetch audit methodology steps
export async function getAuditMethodology() {
  const { data, error } = await supabase
    .from("audit_master_methodology_steps")
    .select("*")
    .order("step_order", { ascending: true });

  if (error) {
    throw new Error(`Error fetching audit methodology: ${error.message}`);
  }
  return data;
}

// Fetch audit principles
export async function getAuditPrinciples() {
  const { data, error } = await supabase
    .from("audit_master_principles")
    .select("*")
    .order("principle", { ascending: true });

  if (error) {
    throw new Error(`Error fetching audit principles: ${error.message}`);
  }
  return data;
}