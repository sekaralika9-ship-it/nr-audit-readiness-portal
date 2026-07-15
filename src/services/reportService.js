const REPORT_RECORDS_KEY = 'nr-audit-report-records'

export function getReportRecords() {
  try {
    const value = localStorage.getItem(REPORT_RECORDS_KEY)
    const records = value ? JSON.parse(value) : []
    return Array.isArray(records) ? records : []
  } catch {
    return []
  }
}

export function saveReportRecord(record) {
  const savedRecord = {
    ...record,
    id: record.id || `RPT-${Date.now()}`,
    createdAt: record.createdAt || new Date().toISOString(),
  }
  const records = getReportRecords()
  const nextRecords = [
    savedRecord,
    ...records.filter((item) => item.id !== savedRecord.id),
  ]
  localStorage.setItem(REPORT_RECORDS_KEY, JSON.stringify(nextRecords))
  window.dispatchEvent(new Event('nr-reports-updated'))
  return savedRecord
}
