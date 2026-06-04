import Image from 'next/image'

export function WatermarkBg() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      <Image
        src="/assets/images/circleStar.png"
        alt=""
        width={900}
        height={900}
        className="absolute right-[-450px] top-1/2 -translate-y-1/2 opacity-40"
        priority
      />
    </div>
  )
}
