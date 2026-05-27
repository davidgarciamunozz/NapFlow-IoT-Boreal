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

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[402px] bg-white border-t border-gray-100 flex justify-around items-center h-[81px] z-20">
      {NAV_LINKS.map(({ href, label, Icon }) => {
        const isActive =
          href === '/app' ? pathname === '/app' : pathname.startsWith(href)
        return (
          <Link key={href} href={href} className="flex flex-col items-center w-[103px]">
            <div
              className={`flex flex-col items-center gap-1 py-2 px-6 rounded-full transition ${
                isActive ? 'bg-active' : 'bg-transparent'
              }`}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.5}
                className={isActive ? 'text-white' : 'text-decoration'}
              />
              <span
                className={`text-[11px] font-semibold tracking-wide ${
                  isActive ? 'text-white' : 'text-decoration'
                }`}
              >
                {label}
              </span>
            </div>
          </Link>
        )
      })}
    </nav>
  )
}
