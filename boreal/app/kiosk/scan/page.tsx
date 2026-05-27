'use client'
import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WatermarkBg } from '@/components/kiosk/WatermarkBg'
import { BorealStars } from '@/components/kiosk/BorealStars'
import { QRScanner } from '@/components/kiosk/QRScanner'

type ScanState = 'scanning' | 'processing' | 'error'

export default function KioskScanPage() {
  const router = useRouter()
  const [state, setState] = useState<ScanState>('scanning')
  const [errorMessage, setErrorMessage] = useState('')

  const handleScan = useCallback(
    async (token: string) => {
      if (state !== 'scanning') return
      setState('processing')

      // Attempt check-in
      const checkInRes = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (checkInRes.ok) {
        const { slotNumber, userName } = await checkInRes.json()
        router.push(
          `/kiosk/assign?slot=${slotNumber}&name=${encodeURIComponent(userName)}`
        )
        return
      }

      const checkInBody = await checkInRes.json()

      // If user already has session → attempt check-out
      if (
        checkInRes.status === 409 &&
        checkInBody.error === 'User already has an active session'
      ) {
        const checkOutRes = await fetch('/api/sessions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        if (checkOutRes.ok) {
          const { pointsAwarded, userName } = await checkOutRes.json()
          router.push(
            `/kiosk/assign?checkout=true&points=${pointsAwarded}&name=${encodeURIComponent(userName)}`
          )
          return
        }
      }

      // Error cases
      if (checkInRes.status === 409 && checkInBody.error === 'No slots available') {
        setErrorMessage('The room is currently full. Please try again later.')
      } else if (checkInRes.status === 400) {
        setErrorMessage('QR code not recognized')
      } else {
        setErrorMessage('Something went wrong. Please try again.')
      }

      setState('error')
      setTimeout(() => setState('scanning'), 3000)
    },
    [state, router]
  )

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center gap-8">
      <WatermarkBg />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <BorealStars />
        <h1 className="text-white font-bold text-[40px] text-center">
          Place QR code in the scanner
        </h1>

        {state === 'scanning' && <QRScanner onScan={handleScan} />}

        {state === 'processing' && (
          <div className="w-[400px] h-[400px] flex items-center justify-center bg-black/20 rounded-2xl">
            <p className="text-white text-xl font-semibold">Processing…</p>
          </div>
        )}

        {state === 'error' && (
          <div className="w-[400px] h-[400px] flex items-center justify-center bg-black/20 rounded-2xl">
            <p className="text-white text-xl font-semibold">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  )
}
