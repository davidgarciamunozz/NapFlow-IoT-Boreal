import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { Star } from 'lucide-react'
import { RewardCard } from '@/components/app/RewardCard'
import { BottomNav } from '@/components/app/BottomNav'

const REWARDS = [
  { name: 'Hoodie ICESI',  cost: 1500, tier: 2000, imageSrc: 'https://placehold.co/120x120/E7E7E9/252525?text=Hoodie' },
  { name: 'Andy Plushie',  cost: 1200, tier: 2000, imageSrc: 'https://placehold.co/120x120/E7E7E9/252525?text=Plushie' },
  { name: 'ICESI Bag',     cost: 1800, tier: 2000, imageSrc: 'https://placehold.co/120x120/E7E7E9/252525?text=Bag' },
  { name: 'Coffee Mug',   cost: 3000, tier: 4000, imageSrc: 'https://placehold.co/120x120/E7E7E9/252525?text=Mug' },
  { name: 'Notebook Set', cost: 3500, tier: 4000, imageSrc: 'https://placehold.co/120x120/E7E7E9/252525?text=Notes' },
  { name: 'Tote Bag',     cost: 3800, tier: 4000, imageSrc: 'https://placehold.co/120x120/E7E7E9/252525?text=Tote' },
]

export default async function RewardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/app/login')

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles').select('points').eq('id', user.id).single()

  return (
    <div className="pb-[100px]">
      <div className="bg-primary rounded-b-[24px] px-5 pt-14 pb-6 flex flex-col items-center">
        <svg width="80" height="56" viewBox="0 0 80 56" fill="none">
          <circle cx="13" cy="34" r="13" fill="#E2EB3E" />
          <circle cx="40" cy="22" r="18" fill="#E2EB3E" />
          <circle cx="67" cy="34" r="13" fill="#E2EB3E" />
          <text x="6"  y="40" fontSize="14" fill="#8D5AF9" fontWeight="bold">★</text>
          <text x="30" y="30" fontSize="18" fill="#8D5AF9" fontWeight="bold">★</text>
          <text x="60" y="40" fontSize="14" fill="#8D5AF9" fontWeight="bold">★</text>
        </svg>
        <h2 className="text-white font-bold text-xl mt-2">Behavior rewards</h2>
      </div>

      <div className="flex items-center justify-between px-5 mt-5">
        <div>
          <p className="font-bold text-text-primary text-lg">Points Rewards</p>
          <p className="text-gray-400 text-xs mt-0.5">Claim with your points</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-500">Your points</span>
          <span className="font-bold text-text-primary ml-1">
            {(profile?.points ?? 0).toLocaleString()}
          </span>
          <Star size={14} className="text-accent-yellow fill-accent-yellow" />
        </div>
      </div>

      {[2000, 4000].map((tier) => (
        <div key={tier} className="mt-5 px-5">
          <p className="text-text-primary font-semibold text-sm mb-3">
            Up to {tier.toLocaleString()} pts
          </p>
          <div className="grid grid-cols-3 gap-3">
            {REWARDS.filter((r) => r.tier === tier).map((r) => (
              <RewardCard key={r.name} name={r.name} cost={r.cost} imageSrc={r.imageSrc} />
            ))}
          </div>
        </div>
      ))}

      <BottomNav />
    </div>
  )
}
