import Link from 'next/link'
import { QrCode } from 'lucide-react'
import { WatermarkBg } from '@/components/kiosk/WatermarkBg'
import { BorealStars } from '@/components/kiosk/BorealStars'

export default function KioskWelcomePage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center gap-8">
      <WatermarkBg />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <BorealStars />
        <h1 className="text-white font-bold text-[52px] text-center leading-tight">
          Welcome to Boreal
        </h1>
        <Link
          href="/kiosk/scan"
          className="bg-white text-black font-bold text-[28px] px-20 py-5 rounded-full hover:bg-white/90 transition"
        >
          Scan QR code
        </Link>
        <QrCode size={44} className="text-white/50 mt-1" strokeWidth={1.5} />
      </div>
    </div>
  )
}
