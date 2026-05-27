'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/app/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="mt-6 w-full border border-red-200 text-red-500 rounded-full py-3.5 font-semibold text-sm hover:bg-red-50 transition"
    >
      Sign out
    </button>
  )
}
