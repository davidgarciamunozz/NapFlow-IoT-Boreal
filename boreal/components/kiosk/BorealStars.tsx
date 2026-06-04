import Image from 'next/image'

export function BorealStars() {
  return (
    <Image
      src="/assets/images/StarsKiosk.png"
      alt=""
      width={220}
      height={154}
      priority
    />
  )
}
