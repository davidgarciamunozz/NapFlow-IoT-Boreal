import { createHmac, timingSafeEqual } from 'crypto'

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

function secret(): string {
  if (!process.env.QR_SECRET) throw new Error('QR_SECRET env var is required')
  return process.env.QR_SECRET
}

export function signToken(userId: string): string {
  const payload = { userId, issuedAt: Date.now() }
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret()).update(data).digest('base64url')
  return `${data}.${sig}`
}

export function verifyToken(token: string): { userId: string; issuedAt: number } {
  const parts = token.split('.')
  if (parts.length !== 2) throw new Error('Invalid token format')
  const [data, sig] = parts
  const expected = createHmac('sha256', secret()).update(data).digest('base64url')
  const sigBuf = Buffer.from(sig)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    throw new Error('Invalid token')
  }
  let payload: { userId: string; issuedAt: number }
  try {
    payload = JSON.parse(Buffer.from(data, 'base64url').toString())
  } catch {
    throw new Error('Invalid token')
  }
  if (Date.now() - payload.issuedAt > TOKEN_TTL_MS) {
    throw new Error('Token expired')
  }
  return payload
}
