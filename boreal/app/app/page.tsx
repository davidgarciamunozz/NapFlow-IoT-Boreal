import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Bell, QrCode } from 'lucide-react'
import { PointsCard } from '@/components/app/PointsCard'
import { AvailabilityGauge } from '@/components/app/AvailabilityGauge'
import { BottomNav } from '@/components/app/BottomNav'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/app/login')

  const service = createServiceClient()
  const [{ data: profile }, { data: slots }, { data: activeSession }] = await Promise.all([
    service.from('profiles').select('*').eq('id', user.id).single(),
    service.from('slots').select('status'),
    service
      .from('sessions')
      .select('id, slots(number)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
  ])

  const available = slots?.filter((s) => s.status === 'available').length ?? 0

  return (
    <div className="pb-[100px]">
      <div className="flex items-start justify-between px-5 pt-14 pb-5">
        <h1 className="text-[35px] font-bold leading-tight bg-gradient-to-br from-primary to-active bg-clip-text text-transparent">
          Hello {profile?.name?.split(' ')[0] ?? 'there'}!
        </h1>
        <button className="relative mt-2 p-1">
          <Bell size={22} className="text-text-primary" />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>

      {profile && <PointsCard profile={profile} />}

      <div className="mx-5 mt-4">
        <Link
          href="/app/qr"
          className="flex items-center justify-between bg-active text-white rounded-[9px] px-5 py-4 font-bold text-[17px] hover:opacity-95 transition"
        >
          <span>
            {activeSession ? 'Active session — tap to view' : 'Generate QR code'}
          </span>
          <QrCode size={28} strokeWidth={2} />
        </Link>
      </div>

      <div className="mt-4">
        <AvailabilityGauge
          initialAvailable={available}
          total={slots?.length ?? 30}
          peakHour="12:00pm"
        />
      </div>

      <BottomNav />
    </div>
  )
}
