import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { Star } from 'lucide-react'
import { LogoutButton } from '@/components/app/LogoutButton'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/app/login')

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles').select('*').eq('id', user.id).single()

  return (
    <div className="pb-[100px] px-5 pt-14">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Settings</h1>

      <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-100 shadow-sm">
        <div className="px-4 py-3.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Name</p>
          <p className="font-medium text-text-primary">{profile?.name}</p>
        </div>
        <div className="px-4 py-3.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Email</p>
          <p className="font-medium text-text-primary">{profile?.email}</p>
        </div>
        <div className="px-4 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Points</p>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-text-primary text-lg">
                {(profile?.points ?? 0).toLocaleString()}
              </span>
              <Star size={14} className="fill-accent-yellow text-accent-yellow" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Streak</p>
            <p className="font-medium text-text-primary">{profile?.streak_days} days</p>
          </div>
        </div>
      </div>

      <LogoutButton />
    </div>
  )
}
