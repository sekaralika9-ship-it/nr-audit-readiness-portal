export default function Settings() {
  return (
    <div style={{ padding: '24px' }}>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
        }}
      >
        <p
          style={{
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#64748b',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          System Configuration
        </p>

        <h1
          style={{
            marginTop: '8px',
            marginBottom: 0,
            fontSize: '28px',
            fontWeight: 800,
            color: '#0f172a',
          }}
        >
          Settings
        </h1>

        <p
          style={{
            marginTop: '10px',
            maxWidth: '760px',
            fontSize: '14px',
            lineHeight: 1.7,
            color: '#475569',
          }}
        >
          This page has been restored so the application can run normally.
          Audit master database data from Supabase should be connected through
          Audit Knowledge Base and Audit Readiness Checklist, not through this
          Settings page.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '16px',
          marginTop: '20px',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '20px',
          }}
        >
          <h2 style={{ fontSize: '16px', color: '#0f172a', margin: 0 }}>
            User Roles & Access
          </h2>
          <p style={{ marginTop: '8px', fontSize: '14px', color: '#64748b' }}>
            Manage user access configuration.
          </p>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '20px',
          }}
        >
          <h2 style={{ fontSize: '16px', color: '#0f172a', margin: 0 }}>
            Workflow Governance
          </h2>
          <p style={{ marginTop: '8px', fontSize: '14px', color: '#64748b' }}>
            Configure audit workflow governance.
          </p>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '20px',
          }}
        >
          <h2 style={{ fontSize: '16px', color: '#0f172a', margin: 0 }}>
            System Preferences
          </h2>
          <p style={{ marginTop: '8px', fontSize: '14px', color: '#64748b' }}>
            Configure application preferences.
          </p>
        </div>
      </div>
    </div>
  )
}