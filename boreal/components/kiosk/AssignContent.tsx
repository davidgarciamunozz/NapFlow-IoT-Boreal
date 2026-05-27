'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WatermarkBg } from './WatermarkBg'
import { BorealStars } from './BorealStars'

interface Props {
  isCheckout: boolean
  slotNumber: string | null
  name: string
  points: string
}

export function AssignContent({ isCheckout, slotNumber, name, points }: Props) {
  const router = useRouter()
  const duration = isCheckout ? 6 : 8
  const [countdown, setCountdown] = useState(duration)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/kiosk')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [router])

  const firstName = decodeURIComponent(name).split(' ')[0]

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center gap-6">
      <WatermarkBg />
      <div className="relative z-10 flex flex-col items-center gap-6 text-center px-10 max-w-3xl">
        <BorealStars />

        {isCheckout ? (
          <>
            <h1 className="text-white font-bold text-[44px] leading-tight">
              See you next time, {firstName}!
            </h1>
            <div className="bg-white/10 rounded-2xl px-10 py-5 backdrop-blur-sm">
              <p className="text-accent-lime font-bold text-3xl">+{points} pts</p>
              <p className="text-white/80 text-sm mt-1">added to your profile</p>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-white font-bold text-[44px] leading-tight">
              Hi {firstName}, take your assigned pillow
            </h1>
            <div className="w-44 h-44 rounded-full bg-[#7A3FE8] flex items-center justify-center shadow-xl">
              <span className="text-white font-bold text-[72px] leading-none">{slotNumber}</span>
            </div>
            <p className="text-white/70 text-lg leading-relaxed">
              Remember this is a shared space, we suggest to only take your assigned pillow
            </p>
          </>
        )}

        <p className="text-white/40 text-sm mt-2">
          Returning to welcome screen in {countdown}s
        </p>
      </div>
    </div>
  )
}
