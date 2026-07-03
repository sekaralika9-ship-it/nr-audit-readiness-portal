import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  FileArchive,
  FileText,
  Files,
  Gauge,
  Library,
  Settings,
  UserCircle,
} from 'lucide-react'

export const navigationItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: Gauge,
    description: 'Audit readiness overview',
  },
  {
    label: 'Audit Readiness',
    path: '/audit-readiness',
    icon: ClipboardCheck,
    description: 'Preparation workspace',
  },
  {
    label: 'ISO Library',
    path: '/iso-library',
    icon: Library,
    description: 'ISO standards and clauses',
  },
  {
    label: 'Evidence Library',
    path: '/evidence-library',
    icon: FileArchive,
    description: 'Audit evidence preparation',
  },
  {
    label: 'Document Library',
    path: '/document-library',
    icon: Files,
    description: 'Controlled document register',
  },
  {
    label: 'Knowledge Center',
    path: '/knowledge-center',
    icon: BookOpen,
    description: 'SOP and work instruction references',
  },
  {
    label: 'Templates',
    path: '/templates',
    icon: FileText,
    description: 'Readiness templates',
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: BarChart3,
    description: 'Executive readiness reporting',
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    description: 'System configuration',
  },
]

export const secondaryNavigation = [
  {
    label: 'Profile',
    path: '/profile',
    icon: UserCircle,
    description: 'Account profile',
  },
]

export const routeMeta = {
  '/dashboard': {
    title: 'Audit Readiness Dashboard',
    subtitle:
      'Centralized workspace to prepare audit evidence, SOP references, ownership, and readiness status before an audit.',
  },
  '/audit-readiness': {
    title: 'Audit Readiness',
    subtitle: 'Manage audit preparation workspaces, checklists, clauses, and readiness progress.',
  },
  '/iso-library': {
    title: 'ISO Library',
    subtitle: 'Access supported ISO standards and future readiness guidance.',
  },
  '/evidence-library': {
    title: 'Evidence Library',
    subtitle: 'Manage required evidence, supporting documents, and document readiness.',
  },
  '/document-library': {
    title: 'Document Library',
    subtitle: 'Maintain controlled document references for audit readiness.',
  },
  '/knowledge-center': {
    title: 'Knowledge Center',
    subtitle: 'Find SOP, work instruction, templates, and audit preparation guidance.',
  },
  '/templates': {
    title: 'Templates',
    subtitle: 'Use structured templates for evidence, SOP mapping, and audit preparation.',
  },
  '/reports': {
    title: 'Reports',
    subtitle: 'Monitor readiness performance, trends, heatmaps, and executive insights.',
  },
  '/settings': {
    title: 'Settings',
    subtitle: 'Configure system preferences and master data.',
  },
  '/profile': {
    title: 'My Profile',
    subtitle: 'Manage personal information and account preferences.',
  },
}
