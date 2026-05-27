import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { signToken } from '@/lib/qr'
import { redirect } from 'next/navigation'
import { QRDisplay } from '@/components/app/QRDisplay'
import type { SessionWithSlot } from '@/lib/types'

export default async function QRPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/app/login')

  const service = createServiceClient()
  const [{ data: profile }, { data: activeSession }] = await Promise.all([
    service.from('profiles').select('name').eq('id', user.id).single(),
    service
      .from('sessions')
      .select('id, slots(number)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
  ])

  const token = signToken(user.id)
  const slotNumber = (activeSession as SessionWithSlot | null)?.slots?.number ?? null

  return (
    <QRDisplay
      token={token}
      profileName={profile?.name ?? 'Student'}
      initialSlotNumber={slotNumber}
      userId={user.id}
    />
  )
}
