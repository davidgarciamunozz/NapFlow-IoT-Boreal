import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 bg-white p-8">
      <div className="flex flex-col items-center gap-3">
        <svg width="96" height="68" viewBox="0 0 96 68" fill="none">
          <circle cx="16" cy="42" r="16" fill="#E2EB3E" />
          <circle cx="48" cy="28" r="22" fill="#E2EB3E" />
          <circle cx="80" cy="42" r="16" fill="#E2EB3E" />
          <text x="9" y="49" fontSize="18" fill="#8D5AF9" fontWeight="bold">★</text>
          <text x="39" y="36" fontSize="22" fill="#8D5AF9" fontWeight="bold">★</text>
          <text x="73" y="49" fontSize="18" fill="#8D5AF9" fontWeight="bold">★</text>
        </svg>
        <h1 className="text-4xl font-bold text-primary">Boreal</h1>
        <p className="text-gray-400 text-sm">Icesi University Relaxation Room</p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/app/login"
          className="px-6 py-3 bg-primary text-white rounded-full font-semibold text-sm hover:opacity-90 transition"
        >
          Student App
        </Link>
        <Link
          href="/kiosk"
          className="px-6 py-3 bg-active text-white rounded-full font-semibold text-sm hover:opacity-90 transition"
        >
          Room Kiosk
        </Link>
      </div>
    </main>
  )
}
