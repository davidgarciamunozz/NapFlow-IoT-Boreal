import Image from 'next/image'

interface Props {
  name: string
  cost: number
  imageSrc: string
  imageClassName?: string
}

export function RewardCard({ name, cost, imageSrc, imageClassName }: Props) {
  return (
    <>
      <div className="bg-white border border-gray-100 rounded-[15px] p-2 shadow-sm">
        <div className="relative">
          <div className="relative w-full aspect-square rounded-[10px] overflow-hidden">
            <Image src="/assets/images/logoIcesiGray.png" alt="" fill className="object-contain p-2" />
            <Image src={imageSrc} alt={name} fill className={`object-contain ${imageClassName ?? ''}`} />
          </div>
          <div className="absolute top-1.5 left-1.5 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Image src="/assets/images/whiteStar.png" alt="" width={10} height={10} />
            {cost.toLocaleString()}<span className="font-medium">pts</span>
          </div>
        </div>
      </div>
      <span className="text-[10px] font-medium text-text-primary leading-tight mt-1.5 block px-0.5">{name}</span>
    </>
  )
}
