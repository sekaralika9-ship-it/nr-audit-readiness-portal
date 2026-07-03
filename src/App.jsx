import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './layouts/AppShell.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AuditReadiness from './pages/AuditReadiness.jsx'
import IsoLibrary from './pages/IsoLibrary.jsx'
import EvidenceLibrary from './pages/EvidenceLibrary.jsx'
import DocumentLibrary from './pages/DocumentLibrary.jsx'
import KnowledgeCenter from './pages/KnowledgeCenter.jsx'
import Templates from './pages/Templates.jsx'
import Reports from './pages/Reports.jsx'
import Settings from './pages/Settings.jsx'
import Profile from './pages/Profile.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/audit-readiness" element={<AuditReadiness />} />
        <Route path="/iso-library" element={<IsoLibrary />} />
        <Route path="/evidence-library" element={<EvidenceLibrary />} />
        <Route path="/document-library" element={<DocumentLibrary />} />
        <Route path="/knowledge-center" element={<KnowledgeCenter />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
