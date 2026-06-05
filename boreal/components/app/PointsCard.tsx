import Image from 'next/image'
import type { Profile } from '@/lib/types'

const MILESTONES = [
  { label: 'Keycharm', pts: 500 },
  { label: 'Pen', pts: 1000 },
  { label: 'Pencil Case', pts: 2000 },
]

export function PointsCard({ profile }: { profile: Profile }) {
  return (
    <div className="bg-primary rounded-[15px] p-4 mx-5">
      <span className="text-white/70 text-sm mb-1 block">points</span>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-[28px] tracking-tight">
            {profile.points.toLocaleString()}
          </span>
          <Image src="/assets/images/circleStarGreen.png" alt="" width={24} height={24} />
        </div>
        <span className="text-white font-bold text-sm">{profile.streak_days} day streak!</span>
      </div>

      <div className="bg-white rounded-[13px] px-4 pt-6 pb-4">
        <div className="relative h-[50px]">
          <div className="absolute top-0 left-[14px] right-[28px] h-[2px] bg-decoration">
            <div
              className="absolute inset-y-0 left-0 bg-active transition-all duration-500"
              style={{ width: `${Math.min((profile.points / 2000) * 100, 100)}%` }}
            />
          </div>
          {MILESTONES.map((m, i) => {
            const reached = profile.points >= m.pts
            const pos = i === 0 ? 'left-0' : i === 1 ? 'left-1/2 -translate-x-1/2' : 'right-0'
            return (
              <div
                key={m.label}
                className={`absolute top-[-13px] flex flex-col items-center ${pos}`}
              >
                <div
                  className={`w-[28px] h-[28px] rounded-full flex items-center justify-center ${
                    reached ? 'bg-active' : 'bg-white border-2 border-decoration'
                  }`}
                >
                  {m.label === 'Pen'
                    ? <Image src="/assets/images/penIcon.png" alt="" width={16} height={16} />
                    : reached && <span className="text-white text-[11px] font-bold">✓</span>
                  }
                </div>
                <span className={`mt-1.5 text-[10px] font-bold whitespace-nowrap ${reached ? 'text-active' : 'text-gray-400'}`}>
                  {m.label}
                </span>
                <span className="text-[9px] text-gray-300 whitespace-nowrap">{m.pts} pts</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
