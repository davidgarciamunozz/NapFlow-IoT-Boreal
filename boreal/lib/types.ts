export interface Profile {
  id: string
  name: string
  email: string
  points: number
  streak_days: number
  created_at: string
}

export interface Slot {
  id: string
  number: number
  status: 'available' | 'occupied'
}

export interface Session {
  id: string
  user_id: string
  slot_id: string
  status: 'active' | 'closed'
  checked_in_at: string
  checked_out_at: string | null
}

export interface PointEvent {
  id: string
  user_id: string
  session_id: string | null
  delta: number
  reason: 'successful_return' | 'non_compliance'
  created_at: string
}

export interface SessionWithSlot extends Session {
  slots: Pick<Slot, 'number'>
}
