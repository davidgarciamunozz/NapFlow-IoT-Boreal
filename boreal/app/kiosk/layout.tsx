export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-primary relative overflow-hidden">
      {children}
    </div>
  )
}
