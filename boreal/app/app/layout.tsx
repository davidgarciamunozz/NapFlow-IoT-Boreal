import { BottomNav } from '@/components/app/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white sm:bg-decoration/40 sm:flex sm:items-center sm:justify-center sm:py-8">
      <div className="relative w-full sm:max-w-[402px] min-h-screen sm:min-h-0 sm:rounded-[2.5rem] sm:shadow-2xl bg-white overflow-hidden">
        {children}
        <BottomNav />
      </div>
    </div>
  )
}
