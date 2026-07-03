export const isoStandards = [
  {
    id: 'iso-9001',
    code: 'ISO 9001',
    title: 'Quality Management System',
    shortTitle: 'Quality Management',
    description:
      'Readiness guidance for quality objectives, documented information, process control, customer focus, performance evaluation, and continual improvement.',
    tone: 'blue',
    clauses: [
      {
        id: '9001-4-1',
        clause: '4.1',
        title: 'Understanding the Organization and Its Context',
        questions: [
          {
            id: 'QMS-4.1-01',
            auditQuestion:
              'Has the function identified internal and external issues that may affect the quality management system and audit readiness?',
            clause: 'ISO 9001 Clause 4.1',
            requiredEvidence:
              'Context analysis, risk register, business process map, stakeholder issue log, management review input.',
            referenceSop:
              'SOP related to quality planning, risk management, or business process governance.',
            pic: 'Quality Management / Related Function Owner',
            status: 'Not Started',
            auditorNotes: '',
            recommendation:
              'Maintain an updated context analysis and ensure relevant risks are linked to quality objectives and process controls.',
          },
        ],
      },
      {
        id: '9001-5-1',
        clause: '5.1',
        title: 'Leadership and Commitment',
        questions: [
          {
            id: 'QMS-5.1-01',
            auditQuestion:
              'How does leadership demonstrate commitment to quality management and ensure that quality objectives are aligned with business direction?',
            clause: 'ISO 9001 Clause 5.1',
            requiredEvidence:
              'Quality policy, management review minutes, leadership communication, quality objective approval, evidence of resource allocation.',
            referenceSop:
              'SOP related to management review, quality governance, or corporate planning.',
            pic: 'Management Representative / Function Leadership',
            status: 'Not Started',
            auditorNotes: '',
            recommendation:
              'Prepare evidence showing leadership involvement, decision-making, and follow-up on quality performance.',
          },
        ],
      },
      {
        id: '9001-7-5',
        clause: '7.5',
        title: 'Documented Information',
        questions: [
          {
            id: 'QMS-7.5-01',
            auditQuestion:
              'Are controlled documents available, updated, approved, and accessible to employees who need them?',
            clause: 'ISO 9001 Clause 7.5',
            requiredEvidence:
              'Document master list, approval record, document revision history, controlled document repository, obsolete document control evidence.',
            referenceSop:
              'SOP related to document control and record management.',
            pic: 'Quality Management / Document Owner',
            status: 'Not Started',
            auditorNotes: '',
            recommendation:
              'Ensure all SOPs, work instructions, and forms have valid approval, revision control, and clear ownership.',
          },
        ],
      },
      {
        id: '9001-9-1',
        clause: '9.1',
        title: 'Monitoring, Measurement, Analysis and Evaluation',
        questions: [
          {
            id: 'QMS-9.1-01',
            auditQuestion:
              'What quality performance indicators are monitored and how are the results evaluated for improvement?',
            clause: 'ISO 9001 Clause 9.1',
            requiredEvidence:
              'KPI dashboard, quality performance report, process monitoring record, analysis result, corrective action follow-up.',
            referenceSop:
              'SOP related to performance monitoring, KPI management, or quality evaluation.',
            pic: 'Quality Management / Process Owner',
            status: 'Not Started',
            auditorNotes: '',
            recommendation:
              'Prepare a clear link between quality objectives, performance data, analysis, and improvement actions.',
          },
        ],
      },
    ],
  },
  {
    id: 'iso-14001',
    code: 'ISO 14001',
    title: 'Environmental Management System',
    shortTitle: 'Environmental Management',
    description:
      'Readiness guidance for environmental aspects, compliance obligations, operational control, emergency preparedness, and environmental performance.',
    tone: 'green',
    clauses: [
      {
        id: '14001-6-1-2',
        clause: '6.1.2',
        title: 'Environmental Aspects',
        questions: [
          {
            id: 'EMS-6.1.2-01',
            auditQuestion:
              'Has the function identified environmental aspects and impacts from its activities, products, or services?',
            clause: 'ISO 14001 Clause 6.1.2',
            requiredEvidence:
              'Environmental aspect-impact register, significance evaluation, operational control plan, monitoring record.',
            referenceSop:
              'SOP related to environmental aspect identification and operational control.',
            pic: 'HSSE / Environmental Owner',
            status: 'Not Started',
            auditorNotes: '',
            recommendation:
              'Ensure aspect-impact evaluation is current and linked to operational controls and compliance obligations.',
          },
        ],
      },
      {
        id: '14001-6-1-3',
        clause: '6.1.3',
        title: 'Compliance Obligations',
        questions: [
          {
            id: 'EMS-6.1.3-01',
            auditQuestion:
              'How does the organization identify, update, and evaluate compliance obligations related to environmental requirements?',
            clause: 'ISO 14001 Clause 6.1.3',
            requiredEvidence:
              'Legal register, compliance evaluation report, permit list, regulatory update record, follow-up action log.',
            referenceSop:
              'SOP related to legal compliance evaluation and environmental permit management.',
            pic: 'HSSE / Legal / Compliance Owner',
            status: 'Not Started',
            auditorNotes: '',
            recommendation:
              'Keep the legal register updated and prepare evidence of periodic compliance evaluation and follow-up.',
          },
        ],
      },
      {
        id: '14001-8-1',
        clause: '8.1',
        title: 'Operational Planning and Control',
        questions: [
          {
            id: 'EMS-8.1-01',
            auditQuestion:
              'What operational controls are implemented to manage significant environmental aspects?',
            clause: 'ISO 14001 Clause 8.1',
            requiredEvidence:
              'Operational control procedure, inspection checklist, monitoring log, waste handling record, contractor environmental requirement.',
            referenceSop:
              'SOP related to operational control, waste management, or environmental monitoring.',
            pic: 'HSSE / Operation / Function Owner',
            status: 'Not Started',
            auditorNotes: '',
            recommendation:
              'Prepare evidence that controls are implemented consistently and monitored according to procedure.',
          },
        ],
      },
    ],
  },
  {
    id: 'iso-45001',
    code: 'ISO 45001',
    title: 'Occupational Health & Safety Management System',
    shortTitle: 'Occupational Health & Safety',
    description:
      'Readiness guidance for hazard identification, risk assessment, consultation and participation, operational control, emergency preparedness, and incident learning.',
    tone: 'orange',
    clauses: [
      {
        id: '45001-5-4',
        clause: '5.4',
        title: 'Consultation and Participation of Workers',
        questions: [
          {
            id: 'OHS-5.4-01',
            auditQuestion:
              'How are workers consulted and involved in occupational health and safety matters?',
            clause: 'ISO 45001 Clause 5.4',
            requiredEvidence:
              'Safety meeting minutes, worker consultation record, participation program, hazard report, follow-up action evidence.',
            referenceSop:
              'SOP related to worker consultation, safety communication, or HSSE participation.',
            pic: 'HSSE / Operation / Function Owner',
            status: 'Not Started',
            auditorNotes: '',
            recommendation:
              'Prepare records showing worker participation, feedback, and management follow-up on OHS matters.',
          },
        ],
      },
      {
        id: '45001-6-1-2',
        clause: '6.1.2',
        title: 'Hazard Identification and Assessment of Risks',
        questions: [
          {
            id: 'OHS-6.1.2-01',
            auditQuestion:
              'Has the function identified hazards, assessed OHS risks, and defined appropriate controls?',
            clause: 'ISO 45001 Clause 6.1.2',
            requiredEvidence:
              'HIRADC/JSA, risk assessment, control hierarchy evidence, work permit, inspection record.',
            referenceSop:
              'SOP related to hazard identification, risk assessment, work permit, or operational safety.',
            pic: 'HSSE / Operation / Engineering Owner',
            status: 'Not Started',
            auditorNotes: '',
            recommendation:
              'Ensure hazard identification is updated for current activities and controls follow the hierarchy of controls.',
          },
        ],
      },
      {
        id: '45001-8-2',
        clause: '8.2',
        title: 'Emergency Preparedness and Response',
        questions: [
          {
            id: 'OHS-8.2-01',
            auditQuestion:
              'Is emergency preparedness planned, tested, evaluated, and improved based on drill results?',
            clause: 'ISO 45001 Clause 8.2',
            requiredEvidence:
              'Emergency response plan, drill scenario, drill report, evaluation result, corrective action follow-up.',
            referenceSop:
              'SOP related to emergency preparedness and response.',
            pic: 'HSSE / Emergency Response Team / Operation',
            status: 'Not Started',
            auditorNotes: '',
            recommendation:
              'Prepare emergency drill records and evidence that lessons learned were followed up.',
          },
        ],
      },
    ],
  },
  {
    id: 'iso-37001',
    code: 'ISO 37001',
    title: 'Anti-Bribery Management System',
    shortTitle: 'Anti-Bribery Management',
    description:
      'Readiness guidance for anti-bribery risk assessment, due diligence, financial and non-financial controls, reporting channels, and investigation readiness.',
    tone: 'purple',
    clauses: [
      {
        id: '37001-4-5',
        clause: '4.5',
        title: 'Bribery Risk Assessment',
        questions: [
          {
            id: 'ABMS-4.5-01',
            auditQuestion:
              'Has the organization assessed bribery risks related to functions, transactions, business partners, and operational activities?',
            clause: 'ISO 37001 Clause 4.5',
            requiredEvidence:
              'Bribery risk assessment, risk criteria, mitigation plan, risk review record, approval evidence.',
            referenceSop:
              'SOP related to anti-bribery risk assessment, compliance, or integrity governance.',
            pic: 'Compliance / Legal / Function Owner',
            status: 'Not Started',
            auditorNotes: '',
            recommendation:
              'Ensure bribery risk assessment is updated, approved, and linked to mitigation controls.',
          },
        ],
      },
      {
        id: '37001-8-2',
        clause: '8.2',
        title: 'Due Diligence',
        questions: [
          {
            id: 'ABMS-8.2-01',
            auditQuestion:
              'How is due diligence performed for personnel, business associates, projects, or transactions with bribery risk exposure?',
            clause: 'ISO 37001 Clause 8.2',
            requiredEvidence:
              'Due diligence checklist, vendor screening result, conflict of interest declaration, approval record, monitoring evidence.',
            referenceSop:
              'SOP related to third-party due diligence, procurement compliance, or conflict of interest.',
            pic: 'Compliance / Procurement / Legal / Function Owner',
            status: 'Not Started',
            auditorNotes: '',
            recommendation:
              'Prepare due diligence records and ensure risk-based approvals are documented.',
          },
        ],
      },
      {
        id: '37001-8-9',
        clause: '8.9',
        title: 'Raising Concerns',
        questions: [
          {
            id: 'ABMS-8.9-01',
            auditQuestion:
              'Are reporting channels available and communicated for raising bribery concerns without fear of retaliation?',
            clause: 'ISO 37001 Clause 8.9',
            requiredEvidence:
              'Whistleblowing channel information, communication evidence, report handling procedure, confidentiality control.',
            referenceSop:
              'SOP related to whistleblowing, grievance handling, or investigation management.',
            pic: 'Compliance / Legal / Corporate Secretary',
            status: 'Not Started',
            auditorNotes: '',
            recommendation:
              'Prepare communication evidence and confirm that concern reporting and protection mechanisms are understood.',
          },
        ],
      },
    ],
  },
  {
    id: 'iso-22301',
    code: 'ISO 22301',
    title: 'Business Continuity Management System',
    shortTitle: 'Business Continuity',
    description:
      'Readiness guidance for business impact analysis, continuity strategy, response structure, exercise program, and continual improvement.',
    tone: 'cyan',
    clauses: [
      {
        id: '22301-8-2-2',
        clause: '8.2.2',
        title: 'Business Impact Analysis',
        questions: [
          {
            id: 'BCMS-8.2.2-01',
            auditQuestion:
              'Has the organization conducted business impact analysis to determine critical activities, impact, and recovery priorities?',
            clause: 'ISO 22301 Clause 8.2.2',
            requiredEvidence:
              'Business impact analysis, critical activity list, maximum tolerable disruption, recovery time objective, approval record.',
            referenceSop:
              'SOP related to business impact analysis and continuity planning.',
            pic: 'Risk Management / Operation / Function Owner',
            status: 'Not Started',
            auditorNotes: '',
            recommendation:
              'Ensure BIA results are current and aligned with business continuity strategy and recovery priorities.',
          },
        ],
      },
      {
        id: '22301-8-4',
        clause: '8.4',
        title: 'Business Continuity Plans and Procedures',
        questions: [
          {
            id: 'BCMS-8.4-01',
            auditQuestion:
              'Are business continuity plans documented, approved, communicated, and available to relevant personnel?',
            clause: 'ISO 22301 Clause 8.4',
            requiredEvidence:
              'Business continuity plan, call tree, response procedure, communication plan, document distribution evidence.',
            referenceSop:
              'SOP related to business continuity plan and crisis communication.',
            pic: 'Risk Management / Corporate Secretary / Operation',
            status: 'Not Started',
            auditorNotes: '',
            recommendation:
              'Prepare approved BCP documents and evidence that relevant personnel understand their roles.',
          },
        ],
      },
      {
        id: '22301-8-5',
        clause: '8.5',
        title: 'Exercise Programme',
        questions: [
          {
            id: 'BCMS-8.5-01',
            auditQuestion:
              'Has the organization exercised and tested business continuity plans and followed up improvement actions?',
            clause: 'ISO 22301 Clause 8.5',
            requiredEvidence:
              'Exercise plan, scenario, attendance list, exercise report, lesson learned, improvement action tracking.',
            referenceSop:
              'SOP related to business continuity exercise and evaluation.',
            pic: 'Risk Management / Operation / Related Function',
            status: 'Not Started',
            auditorNotes: '',
            recommendation:
              'Prepare exercise evidence and show that findings were evaluated and followed up.',
          },
        ],
      },
    ],
  },
]

export const readinessStatuses = ['Not Started', 'In Progress', 'Ready', 'Needs Review']

export const getAllQuestions = () =>
  isoStandards.flatMap((standard) =>
    standard.clauses.flatMap((clause) =>
      clause.questions.map((question) => ({
        ...question,
        standardId: standard.id,
        standardCode: standard.code,
        standardTitle: standard.title,
        clauseTitle: clause.title,
      })),
    ),
  )
