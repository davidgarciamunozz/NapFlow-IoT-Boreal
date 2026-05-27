import { Star } from 'lucide-react'
import type { Profile } from '@/lib/types'

const MILESTONES = [
  { label: 'Keycharm', pts: 500 },
  { label: 'Pen', pts: 1000 },
  { label: 'Pencil Case', pts: 2000 },
]

export function PointsCard({ profile }: { profile: Profile }) {
  return (
    <div className="bg-primary rounded-[15px] p-4 mx-5">
      <div className="flex items-start justify-between mb-1">
        <span className="text-white/70 text-sm">points</span>
        <span className="text-white font-bold text-sm">{profile.streak_days} day streak!</span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-white font-bold text-[28px] tracking-tight">
          {profile.points.toLocaleString()}
        </span>
        <Star size={18} className="text-accent-yellow fill-accent-yellow" />
      </div>

      <div className="bg-white rounded-[13px] px-4 py-3">
        <div className="relative flex justify-between items-start pt-3 pb-6">
          <div className="absolute top-[12px] left-[12px] right-[12px] h-[2px] bg-decoration" />
          <div
            className="absolute top-[12px] left-[12px] h-[2px] bg-active transition-all duration-500"
            style={{ width: `${Math.min((profile.points / 2000) * 100, 100)}%` }}
          />
          {MILESTONES.map((m) => {
            const reached = profile.points >= m.pts
            return (
              <div key={m.label} className="flex flex-col items-center z-10 gap-1">
                <div
                  className={`w-[20px] h-[20px] rounded-full flex items-center justify-center ${
                    reached ? 'bg-active' : 'bg-white border-2 border-decoration'
                  }`}
                >
                  {reached && <span className="text-white text-[9px] font-bold">✓</span>}
                </div>
                <span className={`text-[10px] font-bold ${reached ? 'text-active' : 'text-gray-400'}`}>
                  {m.label}
                </span>
                <span className="text-[9px] text-gray-300">{m.pts} pts</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
