import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase.from('slots').select('status')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const available = data.filter((s) => s.status === 'available').length
  return NextResponse.json({ available, total: data.length, peakHour: '12:00pm' })
}
