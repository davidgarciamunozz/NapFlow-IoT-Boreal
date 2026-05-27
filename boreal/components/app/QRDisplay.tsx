'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  token: string
  profileName: string
  initialSlotNumber: number | null
  userId: string
}

export function QRDisplay({ token, profileName, initialSlotNumber, userId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [slotNumber, setSlotNumber] = useState(initialSlotNumber)

  useEffect(() => {
    async function draw() {
      const QRCode = (await import('qrcode')).default
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, token, {
          width: 240,
          margin: 2,
          color: { dark: '#252525', light: '#FFFFFF' },
        })
      }
    }
    draw()
  }, [token])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('qr-session')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          const { data } = await supabase
            .from('sessions')
            .select('slots(number)')
            .eq('user_id', userId)
            .eq('status', 'active')
            .maybeSingle()
          setSlotNumber((data as any)?.slots?.number ?? null)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const firstName = profileName.split(' ')[0]

  return (
    <div className="min-h-screen flex flex-col items-center px-6 pt-14 pb-8">
      <div className="w-full flex items-center mb-8">
        <Link href="/app" className="flex items-center gap-2 text-primary font-semibold text-sm">
          <ArrowLeft size={18} /> Back
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-text-primary mb-3">{firstName}'s QR</h1>

      <div
        className={`mb-6 px-4 py-1.5 rounded-full text-sm font-semibold ${
          slotNumber
            ? 'bg-primary/10 text-primary'
            : 'bg-gray-100 text-gray-500'
        }`}
      >
        {slotNumber ? `Active · Slot #${slotNumber}` : 'Ready to check in'}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
        <canvas ref={canvasRef} className="rounded-xl" />
      </div>

      <p className="mt-6 text-center text-sm text-gray-400 max-w-[260px] leading-relaxed">
        Scan this at the Boreal kiosk to check in or check out
      </p>
    </div>
  )
}
