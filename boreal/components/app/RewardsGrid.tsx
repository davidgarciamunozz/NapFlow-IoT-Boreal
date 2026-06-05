'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { RewardCard } from './RewardCard'
import type { Reward } from '@/lib/rewards'

interface Props {
  rewards: Reward[]
  userPoints: number
}

const TIERS = [2000, 4000]


function generateCode() {
  const letters = Array.from({ length: 3 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join('')
  const nums = Math.floor(Math.random() * 900 + 100)
  return `${letters}-${nums}`
}

export function RewardsGrid({ rewards, userPoints }: Props) {
  const [selected, setSelected] = useState<Reward | null>(null)
  const [visible, setVisible] = useState(false)
  const [redeemReward, setRedeemReward] = useState<Reward | null>(null)
  const [redeemCode, setRedeemCode] = useState<string | null>(null)
  const [redeemVisible, setRedeemVisible] = useState(false)

  const open = (reward: Reward) => {
    setSelected(reward)
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
  }

  const close = () => {
    setVisible(false)
    setTimeout(() => setSelected(null), 300)
  }

  const handleClaim = () => {
    if (!selected) return
    const code = generateCode()
    setRedeemReward(selected)
    setRedeemCode(code)
    setVisible(false)
    setTimeout(() => {
      setSelected(null)
      requestAnimationFrame(() => requestAnimationFrame(() => setRedeemVisible(true)))
    }, 300)
  }

  const closeRedeem = () => {
    setRedeemVisible(false)
    setTimeout(() => { setRedeemReward(null); setRedeemCode(null) }, 300)
  }

  useEffect(() => {
    const isOpen = !!selected || !!redeemReward
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selected, redeemReward])

  const pointsLeft = selected ? Math.max(selected.cost - userPoints, 0) : 0
  const progress = selected ? Math.min((userPoints / selected.cost) * 100, 100) : 0
  const unlocked = pointsLeft === 0

  return (
    <>
      {/* ── Points Rewards header ── */}
      <div className="flex items-start justify-between px-5 mt-7 mb-1">
        <div>
          <h2 className="text-[22px] font-bold text-text-primary leading-tight">Points Rewards</h2>
          <p className="text-sm text-gray-400 mt-0.5">Claim with your points</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-gray-400 mb-0.5">Your points</p>
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-[20px] font-bold text-text-primary leading-none">
              {userPoints.toLocaleString()}
            </span>
            <Image src="/assets/images/blackStar.png" alt="" width={18} height={18} />
          </div>
        </div>
      </div>

      {/* ── Tier rows (horizontal scroll) ── */}
      {TIERS.map((tier) => (
        <div key={tier} className="mt-5">
          <p className="text-text-primary font-semibold text-sm mb-3 px-5">
            Up to {tier.toLocaleString()} pts
          </p>
          <div className="flex gap-3 px-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {rewards.filter((r) => r.tier === tier).map((r) => (
              <button
                key={r.name}
                onClick={() => open(r)}
                className="flex-shrink-0 w-[120px] text-left"
              >
                <RewardCard name={r.name} cost={r.cost} imageSrc={r.imageSrc} />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* ── Detail bottom sheet ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
            onClick={close}
          />
          <div className={`relative w-full bg-white rounded-t-[2rem] z-10 transition-transform duration-300 ease-out ${visible ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <button onClick={close} className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 text-gray-500">
              <X size={16} />
            </button>
            <div className="px-6 pb-10 pt-2">
              <div className="relative w-44 h-44 mx-auto rounded-2xl overflow-hidden bg-decoration mb-5">
                <Image src={selected.imageSrc} alt={selected.name} fill className="object-cover" />
              </div>
              <h2 className="text-[22px] font-bold text-text-primary text-center leading-tight">
                {selected.name}
              </h2>
              <div className="flex items-center justify-center gap-1.5 mt-1.5">
                <Image src="/assets/images/circleStarGreen.png" alt="" width={18} height={18} />
                <span className="font-bold text-primary text-lg">{selected.cost.toLocaleString()} pts</span>
              </div>
              <div className="mt-6">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400 font-medium">Your points</span>
                  <span className="font-bold text-text-primary">
                    {userPoints.toLocaleString()} / {selected.cost.toLocaleString()}
                  </span>
                </div>
                <div className="h-2.5 bg-decoration rounded-full overflow-hidden">
                  <div className="h-full bg-active rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-center text-sm mt-3">
                  {unlocked ? (
                    <span className="text-active font-bold">You've unlocked this reward!</span>
                  ) : (
                    <>
                      <span className="font-bold text-primary">{pointsLeft.toLocaleString()} pts</span>
                      <span className="text-gray-400"> more to unlock</span>
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={unlocked ? handleClaim : undefined}
                disabled={!unlocked}
                className={`mt-5 w-full py-4 rounded-full font-bold text-sm transition ${
                  unlocked ? 'bg-active text-white' : 'bg-decoration text-gray-400 cursor-not-allowed'
                }`}
              >
                {unlocked ? 'Claim Reward' : 'Keep earning points'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Redemption code modal ── */}
      {redeemReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${redeemVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeRedeem}
          />
          <div className={`relative w-full max-w-[320px] bg-white rounded-3xl overflow-hidden z-10 transition-all duration-300 ${redeemVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <button onClick={closeRedeem} className="absolute top-4 right-4 text-gray-400 z-10">
              <X size={20} />
            </button>

            <div className="px-6 pt-8 pb-8 flex flex-col items-center">
              {/* Code */}
              <h2 className="text-[32px] font-bold text-primary tracking-wide">{redeemCode}</h2>
              <p className="text-gray-500 text-sm text-center mt-2 leading-snug">
                Show this code in the ICESI store<br />to claim your reward.
              </p>

              <div className="relative flex items-center justify-center mt-6 w-[220px] h-[220px]">
                <Image
                  src="/assets/images/logoIcesiGray.png"
                  alt=""
                  width={220}
                  height={220}
                  className="absolute inset-0 opacity-60 pointer-events-none select-none"
                />
                <div className="relative z-10 w-36 h-36">
                  <Image src={redeemReward.imageSrc} alt={redeemReward.name} fill className="object-contain drop-shadow-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
