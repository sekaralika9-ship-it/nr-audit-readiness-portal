import { getAllQuestions, isoStandards } from './isoReadinessData.js'

export const ownerFunctions = [
  'Human Capital',
  'HSSE',
  'SPI',
  'Quality Management',
  'Operation',
  'Engineering',
  'Legal',
  'Corporate Secretary',
]

export const evidenceStatuses = [
  'Not Started',
  'Draft Prepared',
  'Ready for Review',
  'Accepted',
  'Needs Revision',
]

export const documentTypes = [
  'SOP',
  'Work Instruction',
  'Form',
  'Record',
  'Policy',
  'Report',
  'Register',
  'Template',
  'Evidence Attachment',
]

export const evidenceRequirementCatalog = getAllQuestions().map((question) => ({
  id: question.id,
  standardId: question.standardId,
  standardCode: question.standardCode,
  standardTitle: question.standardTitle,
  clause: question.clause,
  clauseTitle: question.clauseTitle,
  auditQuestion: question.auditQuestion,
  requiredEvidence: question.requiredEvidence,
  referenceSop: question.referenceSop,
  recommendedPic: question.pic,
  recommendation: question.recommendation,
}))

function normalizeId(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export const sopReferenceCatalog = Array.from(
  new Map(
    evidenceRequirementCatalog.map((item) => [
      item.referenceSop,
      {
        id: normalizeId(item.referenceSop),
        title: item.referenceSop,
        description:
          'Reference area for audit preparation. The actual controlled SOP or Work Instruction should be linked by the document owner.',
        relatedStandards: Array.from(
          new Set(
            evidenceRequirementCatalog
              .filter((entry) => entry.referenceSop === item.referenceSop)
              .map((entry) => entry.standardCode),
          ),
        ),
        ownerHint: item.recommendedPic,
      },
    ]),
  ).values(),
)

export const templateCatalog = [
  {
    id: 'evidence-index',
    title: 'Evidence Index Template',
    purpose:
      'Helps each function map audit questions, clauses, required evidence, document owner, and readiness status.',
    recommendedFor: 'All ISO readiness workspaces',
    type: 'Template',
    sections: [
      'ISO Standard',
      'Clause',
      'Audit Question',
      'Required Evidence',
      'Document Owner',
      'Evidence Location',
      'Readiness Status',
      'Auditor Notes',
      'Recommendation',
    ],
  },
  {
    id: 'sop-mapping',
    title: 'SOP Reference Mapping Template',
    purpose:
      'Connects audit requirements with relevant SOP, Work Instruction, forms, and controlled records.',
    recommendedFor: 'Quality Management, HSSE, Legal, Operation',
    type: 'Template',
    sections: [
      'Reference SOP',
      'Related Clause',
      'Document Owner',
      'Document Number',
      'Revision Status',
      'Approval Status',
      'Related Evidence',
    ],
  },
  {
    id: 'audit-interview-prep',
    title: 'Audit Interview Preparation Sheet',
    purpose:
      'Prepares PICs to answer practical auditor questions with consistent evidence and clear process explanation.',
    recommendedFor: 'PIC and Function Owner',
    type: 'Template',
    sections: [
      'Potential Auditor Question',
      'Expected Answer',
      'Supporting Evidence',
      'Responsible PIC',
      'Escalation Point',
      'Preparation Notes',
    ],
  },
  {
    id: 'document-readiness',
    title: 'Document Readiness Checklist',
    purpose:
      'Checks whether documents are approved, updated, controlled, accessible, and aligned with audit requirements.',
    recommendedFor: 'Document Owner',
    type: 'Checklist',
    sections: [
      'Document Title',
      'Document Type',
      'Owner Function',
      'Revision',
      'Approval Evidence',
      'Storage Location',
      'Obsolete Control',
      'Readiness Status',
    ],
  },
]

export const knowledgeGuides = [
  {
    id: 'prepare-evidence',
    title: 'How to Prepare Audit Evidence',
    description:
      'Evidence should be relevant, traceable, controlled, approved when required, and directly linked to the audit question.',
    category: 'Evidence Preparation',
  },
  {
    id: 'answer-auditor-question',
    title: 'How to Answer Auditor Questions',
    description:
      'Use process-based answers. Explain what is done, who owns it, which SOP applies, and which evidence proves implementation.',
    category: 'Audit Interview',
  },
  {
    id: 'document-control',
    title: 'How to Check Document Control Readiness',
    description:
      'Confirm document approval, revision history, distribution, accessibility, and obsolete document control before audit.',
    category: 'Document Control',
  },
]

export const supportedStandardsForDocuments = isoStandards.map((standard) => ({
  id: standard.id,
  code: standard.code,
  title: standard.title,
}))
