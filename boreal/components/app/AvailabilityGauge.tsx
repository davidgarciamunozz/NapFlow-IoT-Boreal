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
        <span className="text-[42px] font-bold text-active -mt-14 leading-none">{available}</span>
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
  const cx = 130, cy = 120
  const innerR = 75, outerR = 115

  const step = 180 / (total - 1)
  const gap = 1.0
  const half = (step - gap) / 2
  const toRad = (d: number) => (d * Math.PI) / 180

  const bars = Array.from({ length: total }, (_, i) => {
    const center = 180 + (i / (total - 1)) * 180
    const a1 = toRad(center - half)
    const a2 = toRad(center + half)

    const xi1 = cx + innerR * Math.cos(a1), yi1 = cy + innerR * Math.sin(a1)
    const xi2 = cx + innerR * Math.cos(a2), yi2 = cy + innerR * Math.sin(a2)
    const xo1 = cx + outerR * Math.cos(a1), yo1 = cy + outerR * Math.sin(a1)
    const xo2 = cx + outerR * Math.cos(a2), yo2 = cy + outerR * Math.sin(a2)

    const f = (n: number) => n.toFixed(2)
    const d = [
      `M ${f(xi1)} ${f(yi1)}`,
      `A ${innerR} ${innerR} 0 0 1 ${f(xi2)} ${f(yi2)}`,
      `L ${f(xo2)} ${f(yo2)}`,
      `A ${outerR} ${outerR} 0 0 0 ${f(xo1)} ${f(yo1)}`,
      'Z',
    ].join(' ')

    return { d, active: i < available }
  })

  return (
    <svg
      viewBox="0 0 260 125"
      className="w-full"
      aria-label={`${available} of ${total} slots available`}
    >
      {bars.map((b, i) => (
        <path
          key={i}
          d={b.d}
          fill={b.active ? '#C1F52E' : '#E7E7E9'}
        />
      ))}
    </svg>
  )
}
