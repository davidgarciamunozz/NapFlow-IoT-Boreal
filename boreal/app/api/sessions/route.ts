import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/qr'
import { createServiceClient } from '@/lib/supabase/service'

const CHECKOUT_POINTS = 50

interface SessionWithProfile {
  id: string
  slot_id: string
  profiles: { name: string } | null
}

async function parseToken(request: NextRequest): Promise<{ token: string } | NextResponse> {
  try {
    const body = await request.json()
    if (!body?.token || typeof body.token !== 'string') {
      return NextResponse.json({ error: 'token is required' }, { status: 400 })
    }
    return { token: body.token }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  const parsed = await parseToken(request)
  if (parsed instanceof NextResponse) return parsed
  const { token } = parsed

  let userId: string
  try {
    userId = verifyToken(token).userId
  } catch {
    return NextResponse.json({ error: 'Invalid QR token' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Reject if user already has an active session
  const { data: existing, error: existingError } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 })
  if (existing) {
    return NextResponse.json({ error: 'User already has an active session' }, { status: 409 })
  }

  // Atomically claim the lowest-numbered available slot
  const { data: slot, error: slotError } = await supabase
    .from('slots')
    .update({ status: 'occupied' })
    .eq('status', 'available')
    .order('number', { ascending: true })
    .limit(1)
    .select('id, number')
    .maybeSingle()

  if (slotError) return NextResponse.json({ error: slotError.message }, { status: 500 })
  if (!slot) return NextResponse.json({ error: 'No slots available' }, { status: 409 })

  // Fetch user name for response
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', userId)
    .single()

  // Create session — if this fails, release the slot
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({ user_id: userId, slot_id: slot.id })
    .select('id')
    .single()

  if (sessionError) {
    await supabase.from('slots').update({ status: 'available' }).eq('id', slot.id)
    return NextResponse.json({ error: sessionError.message }, { status: 500 })
  }

  return NextResponse.json({
    sessionId: session.id,
    slotNumber: slot.number,
    userName: profile?.name ?? 'Student',
  })
}

export async function PATCH(request: NextRequest) {
  const parsed = await parseToken(request)
  if (parsed instanceof NextResponse) return parsed
  const { token } = parsed

  let userId: string
  try {
    userId = verifyToken(token).userId
  } catch {
    return NextResponse.json({ error: 'Invalid QR token' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data, error: sessionError } = await supabase
    .from('sessions')
    .select('id, slot_id, profiles(name)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'No active session found' }, { status: 404 })

  const session = data as unknown as SessionWithProfile

  // Close session
  const { error: closeError } = await supabase
    .from('sessions')
    .update({ status: 'closed', checked_out_at: new Date().toISOString() })
    .eq('id', session.id)

  if (closeError) return NextResponse.json({ error: closeError.message }, { status: 500 })

  // Free slot
  const { error: slotError } = await supabase
    .from('slots')
    .update({ status: 'available' })
    .eq('id', session.slot_id)

  if (slotError) return NextResponse.json({ error: slotError.message }, { status: 500 })

  // Record point event — sync_profile_points trigger auto-increments profiles.points
  const { error: pointError } = await supabase.from('point_events').insert({
    user_id: userId,
    session_id: session.id,
    delta: CHECKOUT_POINTS,
    reason: 'successful_return',
  })

  if (pointError) return NextResponse.json({ error: pointError.message }, { status: 500 })

  // Query updated balance (after trigger has fired)
  const { data: updatedProfile } = await supabase
    .from('profiles')
    .select('points')
    .eq('id', userId)
    .single()

  return NextResponse.json({
    pointsAwarded: CHECKOUT_POINTS,
    newTotal: updatedProfile?.points ?? null,
    userName: session.profiles?.name ?? 'Student',
  })
}
