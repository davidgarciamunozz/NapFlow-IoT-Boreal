import { createHmac } from 'crypto'

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
  if (sig !== expected) throw new Error('Invalid token')
  return JSON.parse(Buffer.from(data, 'base64url').toString())
}
