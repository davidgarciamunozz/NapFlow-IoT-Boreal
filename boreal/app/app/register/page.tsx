'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    router.push('/app')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-primary mb-1">Join Boreal</h1>
        <p className="text-gray-400 text-sm">Create your student account</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {[
          { label: 'Full name', type: 'text', value: name, setter: setName, placeholder: 'Marie García' },
          { label: 'Email', type: 'email', value: email, setter: setEmail, placeholder: 'you@icesi.edu.co' },
          { label: 'Password', type: 'password', value: password, setter: setPassword, placeholder: '••••••••' },
        ].map(({ label, type, value, setter, placeholder }) => (
          <div key={label}>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              {label}
            </label>
            <input
              type={type}
              value={value}
              onChange={(e) => setter(e.target.value)}
              required
              placeholder={placeholder}
              minLength={type === 'password' ? 6 : undefined}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition"
            />
          </div>
        ))}
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full bg-primary text-white rounded-full py-4 font-bold text-sm disabled:opacity-60 transition"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-400">
        Already have an account?{' '}
        <Link href="/app/login" className="text-primary font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  )
}
