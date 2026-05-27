export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-decoration/40 flex items-start justify-center sm:items-center sm:py-8">
      <div className="relative w-full max-w-[402px] min-h-screen sm:min-h-0 sm:rounded-[2.5rem] sm:shadow-2xl bg-white overflow-hidden">
        {children}
      </div>
    </div>
  )
}
