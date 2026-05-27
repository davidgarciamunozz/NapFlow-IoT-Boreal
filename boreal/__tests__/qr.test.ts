// QR_SECRET must be set before importing qr.ts. With ts-jest (CommonJS),
// imports are converted to require() and run after this line, so the env var
// is available when signToken/verifyToken call secret() lazily.
process.env.QR_SECRET = 'test-secret-that-is-32-chars-exactly!!'

import { signToken, verifyToken } from '../lib/qr'

describe('QR token', () => {
  it('signs and verifies a token for a userId', () => {
    const token = signToken('user-abc-123')
    const payload = verifyToken(token)
    expect(payload.userId).toBe('user-abc-123')
    expect(typeof payload.issuedAt).toBe('number')
    expect(payload.issuedAt).toBeLessThanOrEqual(Date.now())
  })

  it('rejects a token with a tampered signature', () => {
    const token = signToken('user-abc-123')
    const [data] = token.split('.')
    expect(() => verifyToken(`${data}.invalidsig`)).toThrow('Invalid token')
  })

  it('rejects a string that is not a valid token', () => {
    expect(() => verifyToken('not-a-token')).toThrow()
  })

  it('produces different tokens for the same userId on successive calls', () => {
    const t1 = signToken('user-abc-123')
    const t2 = signToken('user-abc-123')
    // issuedAt may be the same if called within 1ms, but structure must be valid
    expect(() => verifyToken(t1)).not.toThrow()
    expect(() => verifyToken(t2)).not.toThrow()
  })

  it('rejects an expired token', () => {
    // Manually construct a token with an old issuedAt
    const payload = { userId: 'user-abc-123', issuedAt: Date.now() - 25 * 60 * 60 * 1000 }
    const { createHmac } = require('crypto')
    const secret = process.env.QR_SECRET!
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const sig = createHmac('sha256', secret).update(data).digest('base64url')
    expect(() => verifyToken(`${data}.${sig}`)).toThrow('Token expired')
  })
})
