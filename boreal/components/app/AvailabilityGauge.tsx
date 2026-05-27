'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  initialAvailable: number
  total: number
  peakHour: string
}

export function AvailabilityGauge({ initialAvailable, total, peakHour }: Props) {
  const [available, setAvailable] = useState(initialAvailable)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('slots-gauge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slots' }, () => {
        supabase
          .from('slots')
          .select('status')
          .then(({ data, error }) => {
            if (error || !data) return
            setAvailable(data.filter((s) => s.status === 'available').length)
          })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="mx-5 border border-gray-100 rounded-[15px] p-4 bg-white">
      <span className="font-semibold text-text-primary text-sm">Availability</span>
      <div className="flex flex-col items-center">
        <RadialGauge available={available} total={total} />
        <span className="text-[42px] font-bold text-active -mt-10 leading-none">{available}</span>
        <span className="text-sm text-gray-500 mt-1">Available Spots</span>
      </div>
      <div className="flex justify-center mt-3">
        <div className="flex items-center gap-1.5 border border-gray-200 rounded-full px-3 py-1.5">
          <span className="text-[12px] text-gray-500">High demand at</span>
          <span className="text-[11px] text-white bg-primary px-2 py-0.5 rounded-full font-medium">
            {peakHour}
          </span>
        </div>
      </div>
    </div>
  )
}

function RadialGauge({ available, total }: { available: number; total: number }) {
  const cx = 130, cy = 140
  const bars = Array.from({ length: total }, (_, i) => {
    const angle = total <= 1
      ? -225
      : -225 + (i / (total - 1)) * 270
    const rad = (angle * Math.PI) / 180
    const innerR = 52, outerR = 88
    return {
      x1: cx + innerR * Math.cos(rad),
      y1: cy + innerR * Math.sin(rad),
      x2: cx + outerR * Math.cos(rad),
      y2: cy + outerR * Math.sin(rad),
      active: i < available,
    }
  })

  return (
    <svg width="260" height="155" viewBox="0 0 260 155" aria-label={`${available} of ${total} slots available`}>
      {bars.map((b, i) => (
        <line
          key={i}
          x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2}
          stroke={b.active ? '#C1F52E' : '#E7E7E9'}
          strokeWidth={5}
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}
