'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error.message)
        return
      }
      router.push('/app/login')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="mt-6 w-full border border-red-200 text-red-500 rounded-full py-3.5 font-semibold text-sm hover:bg-red-50 disabled:opacity-60 transition"
    >
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
