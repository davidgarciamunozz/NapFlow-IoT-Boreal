import { Star } from 'lucide-react'

interface Props {
  name: string
  cost: number
  imageSrc: string
}

export function RewardCard({ name, cost, imageSrc }: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-[15px] p-2.5 flex flex-col gap-1.5 shadow-sm">
      <div className="relative">
        <img
          src={imageSrc}
          alt={name}
          className="w-full aspect-square object-cover rounded-[10px] bg-decoration"
        />
        <div className="absolute top-1.5 left-1.5 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          <Star size={8} className="fill-accent-yellow text-accent-yellow" />
          {cost.toLocaleString()} pts
        </div>
      </div>
      <span className="text-[11px] font-medium text-text-primary px-0.5">{name}</span>
    </div>
  )
}
