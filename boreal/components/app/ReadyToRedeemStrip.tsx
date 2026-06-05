'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Plus } from 'lucide-react'
import { useAccessibility } from '@/contexts/AccessibilityContext'

interface Props {
  userPoints: number
}

interface GridItem {
  name: string
  imageSrc: string
  cost: number
}

const BEHAVIOR_GRID: GridItem[] = [
  { name: 'Key Charm',   imageSrc: '/assets/images/keyCharm.png',   cost: 800  },
  { name: 'Pencils',     imageSrc: '/assets/images/pencils.png',    cost: 1000 },
  { name: 'Pencil Case', imageSrc: '/assets/images/pencilCase.png', cost: 1200 },
  { name: 'Notes',       imageSrc: '/assets/images/notes.png',      cost: 2800 },
  { name: 'Mug',         imageSrc: '/assets/images/Mug.png',        cost: 2500 },
  { name: 'Coupon',      imageSrc: '/assets/images/coupon.png',     cost: 3200 },
  { name: 'ICESI Cap',   imageSrc: '/assets/images/IcesiCap.png',   cost: 3800 },
]

function generateCode() {
  const letters = Array.from({ length: 3 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join('')
  const nums = Math.floor(Math.random() * 900 + 100)
  return `${letters}-${nums}`
}

export function ReadyToRedeemStrip({ userPoints }: Props) {
  const unlocked = BEHAVIOR_GRID.filter((r) => userPoints >= r.cost)
  const { darkMode } = useAccessibility()

  const cardBg      = darkMode ? '#7c6fff' : '#5454E9'
  const cardNumCol  = darkMode ? '#6a5eee' : '#4747DD'
  const lockedBg    = darkMode ? '#1c1c30' : '#F3F4F6'
  const lockedNumCol = darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'

  // grid popup
  const [showAll, setShowAll]     = useState(false)
  const [allVisible, setAllVisible] = useState(false)

  // detail sheet
  const [selected, setSelected]       = useState<GridItem | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)

  // redeem code modal
  const [redeemReward, setRedeemReward] = useState<GridItem | null>(null)
  const [redeemCode, setRedeemCode]     = useState<string | null>(null)
  const [redeemVisible, setRedeemVisible] = useState(false)

  const openAll = () => {
    setShowAll(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setAllVisible(true)))
  }
  const closeAll = () => {
    setAllVisible(false)
    setTimeout(() => setShowAll(false), 300)
  }

  const openDetail = (item: GridItem) => {
    if (userPoints < item.cost) return
    setSelected(item)
    requestAnimationFrame(() => requestAnimationFrame(() => setDetailVisible(true)))
  }
  const closeDetail = () => {
    setDetailVisible(false)
    setTimeout(() => setSelected(null), 300)
  }

  const handleClaim = () => {
    if (!selected) return
    const code = generateCode()
    setRedeemReward(selected)
    setRedeemCode(code)
    setDetailVisible(false)
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
    const isOpen = showAll || !!selected || !!redeemReward
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showAll, selected, redeemReward])

  const pointsLeft = selected ? Math.max(selected.cost - userPoints, 0) : 0
  const progress   = selected ? Math.min((userPoints / selected.cost) * 100, 100) : 0

  return (
    <>
      {/* ── Behavior rewards card ── */}
      <button
        onClick={openAll}
        className="relative mx-5 w-[calc(100%-40px)] bg-primary rounded-3xl py-5 flex flex-col items-center overflow-hidden"
      >
        {/* watermark stars */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <Image src="/assets/images/circleStar.png" alt="" width={52} height={52} className="absolute top-2 left-2 opacity-30 brightness-50" />
          <Image src="/assets/images/circleStar.png" alt="" width={48} height={48} className="absolute top-2 right-16 opacity-30 brightness-50" />
          <Image src="/assets/images/circleStar.png" alt="" width={56} height={56} className="absolute bottom-2 left-16 opacity-30 brightness-50" />
          <Image src="/assets/images/circleStar.png" alt="" width={52} height={52} className="absolute bottom-2 right-2 opacity-30 brightness-50" />
        </div>
        <Image src="/assets/images/StarsKiosk.png" alt="" width={80} height={56} priority className="relative z-10" />
        <span className="relative z-10 text-white font-bold text-xl mt-2">Behavior rewards</span>
      </button>

      {/* ── Unlocked thumbnails strip ── */}
      {unlocked.length > 0 && (
        <div className="flex gap-3 px-5 overflow-x-auto pt-2 pb-1 mt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {unlocked.slice(0, 3).map((r) => (
            <button
              key={r.name}
              onClick={() => openDetail(r)}
              className="relative flex-shrink-0 w-20 h-20"
            >
              <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-sm">
                <Image src={r.imageSrc} alt={r.name} fill className="object-cover" />
              </div>
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent-yellow flex items-center justify-center shadow z-10">
                <span className="text-primary text-[13px] leading-none">★</span>
              </div>
            </button>
          ))}
          <button
            onClick={openAll}
            className="flex-shrink-0 flex flex-col items-center justify-center w-20 gap-2"
          >
            <div className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center">
              <Plus size={18} className="text-primary" />
            </div>
            <span className="text-sm text-primary font-medium">view all</span>
          </button>
        </div>
      )}

      {/* ── Behavior rewards grid popup ── */}
      {showAll && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${allVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeAll}
          />
          <div
            className={`relative w-full bg-white rounded-t-[2rem] z-10 transition-transform duration-300 ease-out max-h-[90vh] overflow-y-auto ${allVisible ? 'translate-y-0' : 'translate-y-full'}`}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-white z-10">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Close */}
            <button onClick={closeAll} className="absolute top-4 right-4 p-1 text-gray-400 z-20">
              <X size={22} />
            </button>

            <div className="px-5 pb-10 pt-2">
              {/* Header */}
              <div className="flex flex-col items-center mb-6">
                <Image src="/assets/images/blueStar.png" alt="" width={52} height={52} className="mb-3" />
                <h2 className="text-[24px] font-bold text-primary text-center">Behavior rewards</h2>
                <p className="text-gray-400 text-sm text-center mt-1">
                  Remember, this space is shared{'\n'}by everyone
                </p>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-3 gap-3">
                {BEHAVIOR_GRID.slice(0, 6).map((item, i) => {
                  const isUnlocked = userPoints >= item.cost
                  return (
                    <button
                      key={item.name}
                      onClick={() => openDetail(item)}
                      disabled={!isUnlocked}
                      className="relative aspect-square rounded-2xl overflow-hidden"
                    >
                      <div className="absolute inset-0" style={{ backgroundColor: isUnlocked ? cardBg : lockedBg }} />
                      {/* Full-card number watermark */}
                      <span
                        className="absolute bottom-[-18px] left-1/2 -translate-x-1/2 font-bold leading-none select-none"
                        style={{
                          fontSize: '160px',
                          color: isUnlocked ? cardNumCol : lockedNumCol,
                        }}
                      >
                        {i + 1}
                      </span>
                      {/* Product image — bottom-right, bleeds off edges, above number */}
                      <div className="absolute bottom-0 right-0 translate-x-3 translate-y-3 w-[78%] h-[78%] z-10">
                        <div className="relative w-full h-full">
                          <Image
                            src={item.imageSrc}
                            alt={item.name}
                            fill
                            className={`object-contain drop-shadow ${!isUnlocked ? 'opacity-40' : ''}`}
                          />
                        </div>
                      </div>
                      {isUnlocked && (
                        <div className="absolute top-2 right-2 w-7 h-7">
                          <Image src="/assets/images/behaviorStar.png" alt="" fill className="object-contain" />
                        </div>
                      )}
                    </button>
                  )
                })}

                {/* Row 3: cap full-width (col-span-3) */}
                {(() => {
                  const cap = BEHAVIOR_GRID[6]
                  const isUnlocked = userPoints >= cap.cost
                  return (
                    <button
                      onClick={() => openDetail(cap)}
                      disabled={!isUnlocked}
                      className="relative col-span-3 rounded-2xl overflow-hidden"
                      style={{ aspectRatio: '3/1' }}
                    >
                      <div className="absolute inset-0" style={{ backgroundColor: isUnlocked ? cardBg : lockedBg }} />
                      {/* Number 7 — left, close to bottom */}
                      <span
                        className="absolute bottom-[-18px] left-2 font-bold leading-none select-none"
                        style={{
                          fontSize: '160px',
                          color: isUnlocked ? cardNumCol : lockedNumCol,
                        }}
                      >
                        7
                      </span>
                      {/* Logo — center */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[80%]">
                        <div className="relative w-full h-full">
                          <Image
                            src="/assets/images/logoIcesiGray.png"
                            alt=""
                            fill
                            className={`object-contain ${isUnlocked ? 'opacity-30' : 'opacity-20'}`}
                          />
                        </div>
                      </div>
                      {/* Cap — right, bleeds off edge */}
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-[42%] h-[95%]">
                        <div className="relative w-full h-full">
                          <Image
                            src={cap.imageSrc}
                            alt={cap.name}
                            fill
                            className={`object-contain drop-shadow ${!isUnlocked ? 'opacity-40' : ''}`}
                          />
                        </div>
                      </div>
                      {isUnlocked && (
                        <div className="absolute top-2 right-2 w-7 h-7">
                          <Image src="/assets/images/behaviorStar.png" alt="" fill className="object-contain" />
                        </div>
                      )}
                    </button>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail bottom sheet ── */}
      {selected && (
        <div className="fixed inset-0 z-[60] flex items-end">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${detailVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeDetail}
          />
          <div className={`relative w-full bg-white rounded-t-[2rem] z-10 transition-transform duration-300 ease-out ${detailVisible ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <button onClick={closeDetail} className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 text-gray-500">
              <X size={16} />
            </button>
            <div className="px-6 pb-10 pt-2">
              <div className="relative w-44 h-44 mx-auto rounded-2xl overflow-hidden bg-decoration mb-5">
                <Image src={selected.imageSrc} alt={selected.name} fill className="object-cover" />
              </div>
              <h2 className="text-[22px] font-bold text-text-primary text-center leading-tight">{selected.name}</h2>
              <div className="flex items-center justify-center gap-1.5 mt-1.5">
                <Image src="/assets/images/circleStarGreen.png" alt="" width={18} height={18} />
                <span className="font-bold text-primary text-lg">{selected.cost.toLocaleString()} pts</span>
              </div>
              <div className="mt-6">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400 font-medium">Your points</span>
                  <span className="font-bold text-text-primary">{userPoints.toLocaleString()} / {selected.cost.toLocaleString()}</span>
                </div>
                <div className="h-2.5 bg-decoration rounded-full overflow-hidden">
                  <div className="h-full bg-active rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                {pointsLeft === 0 && (
                  <p className="text-center text-sm mt-3 text-active font-bold">You've unlocked this reward!</p>
                )}
              </div>
              <button
                onClick={handleClaim}
                className="mt-5 w-full py-4 rounded-full font-bold text-sm bg-active text-white transition"
              >
                Claim Reward
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Redemption code modal ── */}
      {redeemReward && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
          <div
            className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${redeemVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeRedeem}
          />
          <div className={`relative w-full max-w-[320px] bg-white rounded-3xl overflow-hidden z-10 transition-all duration-300 ${redeemVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <button onClick={closeRedeem} className="absolute top-4 right-4 text-gray-400 z-10">
              <X size={20} />
            </button>
            <div className="px-6 pt-8 pb-8 flex flex-col items-center">
              <h2 className="text-[32px] font-bold text-primary tracking-wide">{redeemCode}</h2>
              <p className="text-gray-500 text-sm text-center mt-2 leading-snug">
                Show this code in the ICESI store<br />to claim your reward.
              </p>
              <div className="relative flex items-center justify-center mt-6 w-[220px] h-[220px]">
                <Image src="/assets/images/logoIcesiGray.png" alt="" width={220} height={220}
                  className="absolute inset-0 opacity-60 pointer-events-none select-none" />
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
