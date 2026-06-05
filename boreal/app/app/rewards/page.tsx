import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { ReadyToRedeemStrip } from '@/components/app/ReadyToRedeemStrip'
import { RewardsGrid } from '@/components/app/RewardsGrid'
import { REWARDS } from '@/lib/rewards'

export default async function RewardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/app/login')

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles').select('points').eq('id', user.id).single()

  const userPoints = profile?.points ?? 0

  return (
    <div className="pb-[100px] pt-12">
      <ReadyToRedeemStrip userPoints={userPoints} />
      <RewardsGrid rewards={REWARDS} userPoints={userPoints} />
    </div>
  )
}
