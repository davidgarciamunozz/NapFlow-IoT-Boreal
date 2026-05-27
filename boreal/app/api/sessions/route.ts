import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/qr'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  const { token } = await request.json()

  let userId: string
  try {
    const payload = verifyToken(token)
    userId = payload.userId
  } catch {
    return NextResponse.json({ error: 'Invalid QR token' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Reject if user already has an active session
  const { data: existing } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'User already has an active session' },
      { status: 409 }
    )
  }

  // Find lowest-numbered available slot
  const { data: slot } = await supabase
    .from('slots')
    .select('id, number')
    .eq('status', 'available')
    .order('number', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!slot) {
    return NextResponse.json({ error: 'No slots available' }, { status: 409 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', userId)
    .single()

  // Mark slot occupied
  await supabase.from('slots').update({ status: 'occupied' }).eq('id', slot.id)

  // Create session
  const { data: session } = await supabase
    .from('sessions')
    .insert({ user_id: userId, slot_id: slot.id })
    .select('id')
    .single()

  return NextResponse.json({
    sessionId: session!.id,
    slotNumber: slot.number,
    userName: profile?.name ?? 'Student',
  })
}

export async function PATCH(request: NextRequest) {
  const { token } = await request.json()

  let userId: string
  try {
    const payload = verifyToken(token)
    userId = payload.userId
  } catch {
    return NextResponse.json({ error: 'Invalid QR token' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Find the user's active session
  const { data: session } = await supabase
    .from('sessions')
    .select('id, slot_id, profiles(name)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (!session) {
    return NextResponse.json({ error: 'No active session found' }, { status: 404 })
  }

  const profile = (session as any).profiles
  const pointsAwarded = 50

  // Close session
  await supabase
    .from('sessions')
    .update({ status: 'closed', checked_out_at: new Date().toISOString() })
    .eq('id', session.id)

  // Free slot
  await supabase.from('slots').update({ status: 'available' }).eq('id', session.slot_id)

  // Record point event — the sync_profile_points trigger auto-increments profiles.points
  await supabase.from('point_events').insert({
    user_id: userId,
    session_id: session.id,
    delta: pointsAwarded,
    reason: 'successful_return',
  })

  // Query updated balance (after trigger has fired)
  const { data: updatedProfile } = await supabase
    .from('profiles')
    .select('points')
    .eq('id', userId)
    .single()

  return NextResponse.json({
    pointsAwarded,
    newTotal: updatedProfile?.points ?? pointsAwarded,
    userName: profile?.name ?? 'Student',
  })
}
