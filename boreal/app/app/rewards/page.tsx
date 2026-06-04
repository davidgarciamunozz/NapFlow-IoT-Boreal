import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { RewardsGrid } from '@/components/app/RewardsGrid'
import { REWARDS } from '@/lib/rewards'

export default async function RewardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/app/login')

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles').select('points').eq('id', user.id).single()

  return (
    <div className="relative pb-[100px] overflow-hidden">
      <div className="bg-primary relative overflow-hidden">
        {/* watermark layer */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <Image src="/assets/images/circleStar.png" alt="" width={95} height={95} className="absolute -top-6 -left-6 opacity-30 brightness-50" />
          <Image src="/assets/images/circleStar.png" alt="" width={60} height={60} className="absolute top-6 left-24 opacity-20 brightness-50" />
          <Image src="/assets/images/circleStar.png" alt="" width={85} height={85} className="absolute -top-4 -right-4 opacity-30 brightness-50" />
          <Image src="/assets/images/circleStar.png" alt="" width={105} height={105} className="absolute -bottom-8 -left-8 opacity-30 brightness-50" />
          <Image src="/assets/images/circleStar.png" alt="" width={100} height={100} className="absolute -bottom-6 -right-6 opacity-30 brightness-50" />
          <Image src="/assets/images/circleStar.png" alt="" width={55} height={55} className="absolute bottom-8 right-20 opacity-20 brightness-50" />
        </div>
        {/* content */}
        <div className="relative z-10 px-5 pt-14 pb-8 flex flex-col items-center">
          <Image src="/assets/images/StarsKiosk.png" alt="" width={90} height={63} priority />
          <h1 className="text-white font-bold text-2xl mt-2">Behavior Rewards</h1>
          <p className="text-white/60 text-sm mt-1">Redeem your points for prizes</p>
          <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
            <Image src="/assets/images/circleStarGreen.png" alt="" width={16} height={16} />
            <span className="text-white font-bold">{(profile?.points ?? 0).toLocaleString()}</span>
            <span className="text-white/60 text-sm">pts available</span>
          </div>
        </div>
      </div>

      <RewardsGrid rewards={REWARDS} userPoints={profile?.points ?? 0} />

    </div>
  )
}
