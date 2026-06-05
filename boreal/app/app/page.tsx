import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Bell, QrCode } from 'lucide-react'
import { PointsCard } from '@/components/app/PointsCard'
import { AvailabilityGauge } from '@/components/app/AvailabilityGauge'

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
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <Image
        src="/assets/images/logoIcesiGray.png"
        alt=""
        width={180}
        height={180}
        className="absolute top-[30px] right-[0px] opacity-40 pointer-events-none select-none z-0"
        priority
      />

      <div className="relative flex flex-col flex-1 justify-between pb-[100px]">
        {/* Group 1: greeting + points card */}
        <div>
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
        </div>

        {/* Group 2: QR code button */}
        <div className="mx-5">
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

        {/* Group 3: availability gauge */}
        <AvailabilityGauge
          initialAvailable={available}
          total={slots?.length ?? 30}
          peakHour="12:00pm"
        />
      </div>

    </div>
  )
}
