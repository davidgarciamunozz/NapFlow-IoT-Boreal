'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Gift, Home, Settings } from 'lucide-react'

const NAV_LINKS = [
  { href: '/app/rewards', label: 'Rewards', Icon: Gift },
  { href: '/app', label: 'Home', Icon: Home },
  { href: '/app/settings', label: 'Settings', Icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  if (pathname === '/app/login' || pathname === '/app/register') return null

  const activeIndex = NAV_LINKS.findIndex(({ href }) =>
    href === '/app' ? pathname === '/app' : pathname.startsWith(href)
  )

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[402px] bg-white border-t border-gray-100 h-[81px] z-20 flex items-center">
      {/* sliding pill */}
      <div
        className="absolute top-1/2 -translate-y-1/2 h-[52px] rounded-full bg-active transition-all duration-300 ease-in-out"
        style={{
          width: 'calc(33.333% - 16px)',
          left: `calc(${activeIndex * 33.333}% + 8px)`,
        }}
      />

      {NAV_LINKS.map(({ href, label, Icon }, i) => {
        const isActive = i === activeIndex
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-1 py-2 relative z-10"
          >
            <Icon
              size={20}
              strokeWidth={isActive ? 2.5 : 1.5}
              className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-decoration'}`}
            />
            <span className={`text-[11px] font-semibold tracking-wide transition-colors duration-300 ${isActive ? 'text-white' : 'text-decoration'}`}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
