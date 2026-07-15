export const officialAuditees = [
  { code: 'A01', name: 'Direksi' },
  { code: 'A02', name: 'VP Strategic Planning & Business Development' },
  { code: 'A03', name: 'Corporate Secretary' },
  { code: 'A04', name: 'VP Risk Strategy & Governance' },
  { code: 'A05', name: 'VP Risk Implementation' },
  { code: 'A06', name: 'Manager HSSE' },
  { code: 'A07', name: 'Manager Legal & Compliance' },
  { code: 'A08', name: 'Chief Audit Executive' },
  { code: 'A09', name: 'VP Operation' },
  { code: 'A10', name: 'VP Engineering & Maintenance' },
  { code: 'A11', name: 'VP Finance' },
  { code: 'A12', name: 'Manager HCQM' },
  { code: 'A13', name: 'Manager ISGA' },
  { code: 'A14', name: 'Manager Procurement' },
  { code: 'A15', name: 'Manager Commercial LNG & Gas' },
]

export const auditeeOptions = officialAuditees.map((auditee) => ({
  ...auditee,
  id: auditee.code,
  label: `${auditee.code} — ${auditee.name}`,
}))

