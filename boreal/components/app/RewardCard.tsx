import Image from 'next/image'
import { Star } from 'lucide-react'

interface Props {
  name: string
  cost: number
  imageSrc: string
}

export function RewardCard({ name, cost, imageSrc }: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-[15px] p-2 flex flex-col gap-1.5 shadow-sm">
      <div className="relative">
        <div className="relative w-full aspect-square rounded-[10px] overflow-hidden">
          <Image src="/assets/images/logoIcesiGray.png" alt="" fill className="object-contain p-2 opacity-20" />
          <Image src={imageSrc} alt={name} fill className="object-contain" />
        </div>
        <div className="absolute top-1.5 left-1.5 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          <Star size={7} className="fill-accent-yellow text-accent-yellow" />
          {cost.toLocaleString()}
        </div>
      </div>
      <span className="text-[10px] font-medium text-text-primary px-0.5 leading-tight">{name}</span>
    </div>
  )
}
