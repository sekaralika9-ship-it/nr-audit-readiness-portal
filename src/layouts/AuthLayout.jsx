export default function AuthLayout({ children }) {
  return (
    <main className="min-h-screen bg-[#F5F7FA] p-4 lg:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white nr-card-shadow lg:min-h-[calc(100vh-3rem)]">
        {children}
      </div>
    </main>
  )
}
