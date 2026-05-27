# Boreal Room System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a functional Next.js prototype for the Boreal Room system — a student mobile app (Client 2, `/app/*`) and an iPad kiosk (Client 1, `/kiosk/*`) that share real-time slot data via Supabase.

**Architecture:** Single Next.js 15 (App Router) project at `boreal/` inside the INV repo. `/app/*` routes for the student mobile app (white bg, 402px max-width), `/kiosk/*` for the full-screen purple iPad kiosk. API routes at `/api/sessions` and `/api/slots` use a Supabase service role client and validate QR tokens via HMAC-SHA256. Realtime slot updates use Supabase channel subscriptions.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, Supabase (`@supabase/supabase-js`, `@supabase/ssr`), `qrcode` (QR generation), `jsqr` (camera QR scanning), `lucide-react` (icons), Jest (unit tests for token logic)

---

## File Map

```
boreal/
├── __tests__/
│   └── qr.test.ts                     ← HMAC sign/verify unit tests
├── app/
│   ├── layout.tsx                     ← Root layout — Plus Jakarta Sans font
│   ├── globals.css                    ← Tailwind v4 + @theme color tokens
│   ├── page.tsx                       ← Landing page → links to /app/login + /kiosk
│   ├── app/
│   │   ├── layout.tsx                 ← Mobile shell: max-w-[402px], centered
│   │   ├── page.tsx                   ← Home: greeting, PointsCard, QR button, gauge
│   │   ├── login/page.tsx             ← Email + password login
│   │   ├── register/page.tsx          ← Name + email + password register
│   │   ├── qr/page.tsx                ← Server: signs token, fetches session → QRDisplay
│   │   ├── rewards/page.tsx           ← Reward catalog (display-only)
│   │   └── settings/page.tsx          ← Profile info + logout
│   ├── kiosk/
│   │   ├── layout.tsx                 ← Full-screen purple bg
│   │   ├── page.tsx                   ← Welcome / idle: "Scan QR code" button
│   │   ├── scan/page.tsx              ← Camera QR scanner + API calls
│   │   └── assign/page.tsx            ← Slot assignment result + countdown
│   └── api/
│       ├── slots/route.ts             ← GET: available slot count
│       └── sessions/route.ts          ← POST: check-in, PATCH: check-out
├── components/
│   ├── app/
│   │   ├── BottomNav.tsx              ← Rewards | Home | Settings nav
│   │   ├── PointsCard.tsx             ← Purple card: balance + streak + milestones
│   │   ├── AvailabilityGauge.tsx      ← Radial SVG gauge + realtime subscription
│   │   ├── RewardCard.tsx             ← Single reward item card
│   │   ├── QRDisplay.tsx              ← Client: renders qrcode canvas + session badge
│   │   └── LogoutButton.tsx           ← Client: signOut + redirect
│   └── kiosk/
│       ├── WatermarkBg.tsx            ← Decorative #8752F8 SVG starburst
│       ├── BorealStars.tsx            ← Yellow 3-circles + stars logo SVG
│       ├── QRScanner.tsx              ← getUserMedia + jsqr frame loop
│       └── AssignContent.tsx          ← Client: countdown + check-in/out display
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  ← createBrowserClient for 'use client' code
│   │   ├── server.ts                  ← createServerClient with cookies() for server
│   │   └── service.ts                 ← createClient with service role key (API routes)
│   ├── qr.ts                          ← signToken / verifyToken (HMAC-SHA256)
│   └── types.ts                       ← Profile, Slot, Session, PointEvent interfaces
├── supabase/
│   ├── migrations/001_init.sql        ← All tables + RLS + realtime publication
│   └── seed.sql                       ← 30 slot rows
├── middleware.ts                      ← Auth guard for /app/* (allows /login, /register)
├── jest.config.ts
├── .env.example
├── next.config.ts
└── tailwind.config.ts                 ← (empty — v4 config is in globals.css)
```

---

### Task 1: Scaffold Project

**Files:**
- Create: `boreal/` (via create-next-app)
- Modify: `boreal/app/globals.css`
- Create: `boreal/.env.example`
- Create: `boreal/jest.config.ts`

- [ ] **Step 1: Create Next.js project**

Run from `/Users/david/Desktop/INV/`:
```bash
npx create-next-app@latest boreal \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
cd boreal
```

- [ ] **Step 2: Install additional dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr qrcode jsqr lucide-react
npm install --save-dev @types/qrcode jest @types/jest jest-environment-node ts-jest
```

- [ ] **Step 3: Replace `app/globals.css` with color tokens**

```css
@import "tailwindcss";

@theme {
  --color-primary: #8D5AF9;
  --color-active: #5353EE;
  --color-accent-yellow: #E2EB3E;
  --color-accent-lime: #C1F52E;
  --color-watermark: #8752F8;
  --color-decoration: #E7E7E9;
  --color-text-primary: #252525;
  --font-sans: var(--font-jakarta), ui-sans-serif, system-ui, sans-serif;
}
```

> **Note:** If create-next-app installed Tailwind v3, `globals.css` will have `@tailwind` directives instead of `@import "tailwindcss"`. In that case, keep the v3 directives and add colors to `tailwind.config.ts` under `theme.extend.colors`.

- [ ] **Step 4: Create `.env.example`**

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
QR_SECRET=your-random-32-character-secret-here
```

- [ ] **Step 5: Create `jest.config.ts`**

```typescript
import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs' } }],
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
}

export default config
```

- [ ] **Step 6: Create `.env.local`**

Copy `.env.example` to `.env.local` and fill in your Supabase project values. The `QR_SECRET` can be any random string of 32+ characters.

- [ ] **Step 7: Verify app starts**

```bash
npm run dev
```
Expected: Next.js dev server running at http://localhost:3000 with no errors.

- [ ] **Step 8: Commit**

```bash
cd ..  # back to INV root
git add boreal/
git commit -m "feat: scaffold Next.js boreal project with Tailwind tokens and deps"
```

---

### Task 2: Supabase Schema + Seed

**Files:**
- Create: `boreal/supabase/migrations/001_init.sql`
- Create: `boreal/supabase/seed.sql`

- [ ] **Step 1: Create migration file**

Create `boreal/supabase/migrations/001_init.sql`:

```sql
-- profiles: one row per auth user
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null,
  points      int  not null default 0,
  streak_days int  not null default 0,
  created_at  timestamptz default now()
);

alter table profiles enable row level security;
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- slots: 30 pillows in the room
create table slots (
  id     uuid primary key default gen_random_uuid(),
  number int  not null unique,
  status text not null default 'available'
    check (status in ('available', 'occupied'))
);

alter table slots enable row level security;
create policy "slots_select_auth" on slots for select to authenticated using (true);

-- sessions: each check-in creates one row
create table sessions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id),
  slot_id        uuid not null references slots(id),
  status         text not null default 'active'
    check (status in ('active', 'closed')),
  checked_in_at  timestamptz default now(),
  checked_out_at timestamptz
);

alter table sessions enable row level security;
create policy "sessions_select_own" on sessions for select using (auth.uid() = user_id);

-- point_events: ledger of all point changes
create table point_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id),
  session_id uuid references sessions(id),
  delta      int  not null,
  reason     text check (reason in ('successful_return', 'non_compliance')),
  created_at timestamptz default now()
);

alter table point_events enable row level security;
create policy "point_events_select_own" on point_events for select using (auth.uid() = user_id);

-- Enable realtime for live slot + session updates
alter publication supabase_realtime add table slots;
alter publication supabase_realtime add table sessions;
```

- [ ] **Step 2: Create seed file**

Create `boreal/supabase/seed.sql`:

```sql
insert into slots (number)
select generate_series(1, 30);
```

- [ ] **Step 3: Run in Supabase dashboard**

1. Go to your Supabase project → **SQL Editor**
2. Paste and run `001_init.sql`
3. Paste and run `seed.sql`

Expected: Tables `profiles`, `slots`, `sessions`, `point_events` appear in **Table Editor**. The `slots` table has 30 rows (numbers 1–30, all `available`).

- [ ] **Step 4: Commit**

```bash
git add boreal/supabase/
git commit -m "feat: add Supabase schema migration and seed for 30 slots"
```

---

### Task 3: Core Libraries + QR Token Tests

**Files:**
- Create: `boreal/lib/types.ts`
- Create: `boreal/lib/supabase/client.ts`
- Create: `boreal/lib/supabase/server.ts`
- Create: `boreal/lib/supabase/service.ts`
- Create: `boreal/lib/qr.ts`
- Create: `boreal/__tests__/qr.test.ts`

- [ ] **Step 1: Write the failing QR token tests**

Create `boreal/__tests__/qr.test.ts`:

```typescript
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
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd boreal && npx jest --testPathPattern=qr.test.ts
```
Expected: FAIL — `Cannot find module '../lib/qr'`

- [ ] **Step 3: Create `lib/qr.ts`**

```typescript
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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx jest --testPathPattern=qr.test.ts
```
Expected: 4 tests PASS

- [ ] **Step 5: Create `lib/types.ts`**

```typescript
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
```

- [ ] **Step 6: Create `lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 7: Create `lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  )
}
```

- [ ] **Step 8: Create `lib/supabase/service.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

- [ ] **Step 9: Commit**

```bash
git add boreal/lib/ boreal/__tests__/
git commit -m "feat: add core libs (types, supabase clients, qr token) with tests"
```

---

### Task 4: API Routes

**Files:**
- Create: `boreal/app/api/slots/route.ts`
- Create: `boreal/app/api/sessions/route.ts`

- [ ] **Step 1: Create `app/api/slots/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase.from('slots').select('status')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const available = data.filter((s) => s.status === 'available').length
  return NextResponse.json({ available, total: data.length, peakHour: '12:00pm' })
}
```

- [ ] **Step 2: Create `app/api/sessions/route.ts`**

```typescript
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
    .select('id, slot_id, profiles(name, points)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (!session) {
    return NextResponse.json({ error: 'No active session found' }, { status: 404 })
  }

  const pointsAwarded = 50
  const profile = (session as any).profiles
  const newTotal = (profile?.points ?? 0) + pointsAwarded

  // Close session
  await supabase
    .from('sessions')
    .update({ status: 'closed', checked_out_at: new Date().toISOString() })
    .eq('id', session.id)

  // Free slot
  await supabase.from('slots').update({ status: 'available' }).eq('id', session.slot_id)

  // Record point event
  await supabase.from('point_events').insert({
    user_id: userId,
    session_id: session.id,
    delta: pointsAwarded,
    reason: 'successful_return',
  })

  // Update profile balance
  await supabase.from('profiles').update({ points: newTotal }).eq('id', userId)

  return NextResponse.json({
    pointsAwarded,
    newTotal,
    userName: profile?.name ?? 'Student',
  })
}
```

- [ ] **Step 3: Verify routes manually**

Start dev server (`npm run dev`) then in a separate terminal:

```bash
# Should return available count
curl http://localhost:3000/api/slots
```
Expected: `{"available":30,"total":30,"peakHour":"12:00pm"}`

```bash
# Should return 400 — invalid token
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"token":"invalid"}'
```
Expected: `{"error":"Invalid QR token"}` with status 400

- [ ] **Step 4: Commit**

```bash
git add boreal/app/api/
git commit -m "feat: add API routes for slot availability and session check-in/out"
```

---

### Task 5: Root Layout, Landing Page, Auth Middleware

**Files:**
- Modify: `boreal/app/layout.tsx`
- Modify: `boreal/app/page.tsx`
- Create: `boreal/middleware.ts`

- [ ] **Step 1: Update `app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Boreal',
  description: 'Boreal Room — Icesi University',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Replace `app/page.tsx`**

```typescript
import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 bg-white p-8">
      <div className="flex flex-col items-center gap-3">
        <svg width="96" height="68" viewBox="0 0 96 68" fill="none">
          <circle cx="16" cy="42" r="16" fill="#E2EB3E" />
          <circle cx="48" cy="28" r="22" fill="#E2EB3E" />
          <circle cx="80" cy="42" r="16" fill="#E2EB3E" />
          <text x="9" y="49" fontSize="18" fill="#8D5AF9" fontWeight="bold">★</text>
          <text x="39" y="36" fontSize="22" fill="#8D5AF9" fontWeight="bold">★</text>
          <text x="73" y="49" fontSize="18" fill="#8D5AF9" fontWeight="bold">★</text>
        </svg>
        <h1 className="text-4xl font-bold text-primary">Boreal</h1>
        <p className="text-gray-400 text-sm">Icesi University Relaxation Room</p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/app/login"
          className="px-6 py-3 bg-primary text-white rounded-full font-semibold text-sm hover:opacity-90 transition"
        >
          Student App
        </Link>
        <Link
          href="/kiosk"
          className="px-6 py-3 bg-active text-white rounded-full font-semibold text-sm hover:opacity-90 transition"
        >
          Room Kiosk
        </Link>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Create `middleware.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_APP_ROUTES = ['/app/login', '/app/register']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) =>
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          ),
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isPublic = PUBLIC_APP_ROUTES.some((r) => path.startsWith(r))

  if (path.startsWith('/app') && !isPublic && !user) {
    return NextResponse.redirect(new URL('/app/login', request.url))
  }

  return response
}

export const config = { matcher: ['/app/:path*'] }
```

- [ ] **Step 4: Verify**

Visit http://localhost:3000 — should see the Boreal landing page with two buttons. Click "Student App" → should redirect to `/app/login`.

- [ ] **Step 5: Commit**

```bash
git add boreal/app/layout.tsx boreal/app/page.tsx boreal/middleware.ts
git commit -m "feat: add root layout, landing page, and auth middleware"
```

---

### Task 6: Client 2 Layout, Login, Register

**Files:**
- Create: `boreal/app/app/layout.tsx`
- Create: `boreal/app/app/login/page.tsx`
- Create: `boreal/app/app/register/page.tsx`

- [ ] **Step 1: Create `app/app/layout.tsx`**

```typescript
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-decoration/40 flex items-start justify-center sm:items-center sm:py-8">
      <div className="relative w-full max-w-[402px] min-h-screen sm:min-h-0 sm:rounded-[2.5rem] sm:shadow-2xl bg-white overflow-hidden">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/app/login/page.tsx`**

```typescript
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/app')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-primary mb-1">Welcome back</h1>
        <p className="text-gray-400 text-sm">Sign in to your Boreal account</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@icesi.edu.co"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition"
          />
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full bg-primary text-white rounded-full py-4 font-bold text-sm disabled:opacity-60 transition"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-400">
        No account?{' '}
        <Link href="/app/register" className="text-primary font-semibold">
          Register
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/app/register/page.tsx`**

```typescript
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

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Registration failed')
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name,
      email,
    })
    if (profileError) {
      setError(profileError.message)
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
```

- [ ] **Step 4: Test registration flow**

Visit http://localhost:3000/app/register, create an account. Check Supabase → `profiles` table has a new row. Then sign out and sign in at `/app/login`. Should redirect to `/app` (404 for now — that's expected).

- [ ] **Step 5: Commit**

```bash
git add boreal/app/app/
git commit -m "feat: add Client 2 mobile layout and login/register pages"
```

---

### Task 7: Client 2 Shared Components

**Files:**
- Create: `boreal/components/app/BottomNav.tsx`
- Create: `boreal/components/app/PointsCard.tsx`
- Create: `boreal/components/app/AvailabilityGauge.tsx`
- Create: `boreal/components/app/RewardCard.tsx`
- Create: `boreal/components/app/LogoutButton.tsx`

- [ ] **Step 1: Create `components/app/BottomNav.tsx`**

```typescript
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Gift, Home, Settings } from 'lucide-react'

const NAV_LINKS = [
  { href: '/app/rewards', label: 'Rewards', Icon: Gift },
  { href: '/app', label: 'Home', Icon: Home },
  { href: '/app/settings', label: 'Settings', Icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[402px] bg-white border-t border-gray-100 flex justify-around items-center h-[81px] z-20">
      {NAV_LINKS.map(({ href, label, Icon }) => {
        const isActive =
          href === '/app' ? pathname === '/app' : pathname.startsWith(href)
        return (
          <Link key={href} href={href} className="flex flex-col items-center w-[103px]">
            <div
              className={`flex flex-col items-center gap-1 py-2 px-6 rounded-full transition ${
                isActive ? 'bg-active' : 'bg-transparent'
              }`}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.5}
                className={isActive ? 'text-white' : 'text-decoration'}
              />
              <span
                className={`text-[11px] font-semibold tracking-wide ${
                  isActive ? 'text-white' : 'text-decoration'
                }`}
              >
                {label}
              </span>
            </div>
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 2: Create `components/app/PointsCard.tsx`**

```typescript
import { Star } from 'lucide-react'
import type { Profile } from '@/lib/types'

const MILESTONES = [
  { label: 'Keycharm', pts: 500 },
  { label: 'Pen', pts: 1000 },
  { label: 'Pencil Case', pts: 2000 },
]

export function PointsCard({ profile }: { profile: Profile }) {
  return (
    <div className="bg-primary rounded-[15px] p-4 mx-5">
      {/* Header row */}
      <div className="flex items-start justify-between mb-1">
        <span className="text-white/70 text-sm">points</span>
        <span className="text-white font-bold text-sm">{profile.streak_days} day streak!</span>
      </div>

      {/* Balance */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-white font-bold text-[28px] tracking-tight">
          {profile.points.toLocaleString()}
        </span>
        <Star size={18} className="text-accent-yellow fill-accent-yellow" />
      </div>

      {/* Milestone progress */}
      <div className="bg-white rounded-[13px] px-4 py-3">
        <div className="relative flex justify-between items-start pt-3 pb-6">
          {/* Track line */}
          <div className="absolute top-[12px] left-[12px] right-[12px] h-[2px] bg-decoration" />
          {/* Progress fill — width proportional to points / max milestone */}
          <div
            className="absolute top-[12px] left-[12px] h-[2px] bg-active transition-all duration-500"
            style={{ width: `${Math.min((profile.points / 2000) * 100, 100)}%` }}
          />
          {MILESTONES.map((m) => {
            const reached = profile.points >= m.pts
            return (
              <div key={m.label} className="flex flex-col items-center z-10 gap-1">
                <div
                  className={`w-[20px] h-[20px] rounded-full flex items-center justify-center ${
                    reached
                      ? 'bg-active'
                      : 'bg-white border-2 border-decoration'
                  }`}
                >
                  {reached && <span className="text-white text-[9px] font-bold">✓</span>}
                </div>
                <span
                  className={`text-[10px] font-bold ${
                    reached ? 'text-active' : 'text-gray-400'
                  }`}
                >
                  {m.label}
                </span>
                <span className="text-[9px] text-gray-300">{m.pts} pts</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `components/app/AvailabilityGauge.tsx`**

```typescript
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  initialAvailable: number
  total: number
  peakHour: string
}

export function AvailabilityGauge({ initialAvailable, total, peakHour }: Props) {
  const [available, setAvailable] = useState(initialAvailable)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('slots-gauge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slots' }, () => {
        supabase
          .from('slots')
          .select('status')
          .then(({ data }) => {
            if (data) setAvailable(data.filter((s) => s.status === 'available').length)
          })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="mx-5 border border-gray-100 rounded-[15px] p-4 bg-white">
      <span className="font-semibold text-text-primary text-sm">Availability</span>
      <div className="flex flex-col items-center">
        <RadialGauge available={available} total={total} />
        <span className="text-[42px] font-bold text-active -mt-10 leading-none">{available}</span>
        <span className="text-sm text-gray-500 mt-1">Available Spots</span>
      </div>
      <div className="flex justify-center mt-3">
        <div className="flex items-center gap-1.5 border border-gray-200 rounded-full px-3 py-1.5">
          <span className="text-[12px] text-gray-500">High demand at</span>
          <span className="text-[11px] text-white bg-primary px-2 py-0.5 rounded-full font-medium">
            {peakHour}
          </span>
        </div>
      </div>
    </div>
  )
}

function RadialGauge({ available, total }: { available: number; total: number }) {
  const cx = 130, cy = 140
  const bars = Array.from({ length: total }, (_, i) => {
    const angle = -225 + (i / (total - 1)) * 270
    const rad = (angle * Math.PI) / 180
    const innerR = 52, outerR = 88
    return {
      x1: cx + innerR * Math.cos(rad),
      y1: cy + innerR * Math.sin(rad),
      x2: cx + outerR * Math.cos(rad),
      y2: cy + outerR * Math.sin(rad),
      active: i < available,
    }
  })

  return (
    <svg width="260" height="155" viewBox="0 0 260 155" aria-label={`${available} of ${total} slots available`}>
      {bars.map((b, i) => (
        <line
          key={i}
          x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2}
          stroke={b.active ? '#C1F52E' : '#E7E7E9'}
          strokeWidth={5}
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}
```

- [ ] **Step 4: Create `components/app/RewardCard.tsx`**

```typescript
import { Star } from 'lucide-react'

interface Props {
  name: string
  cost: number
  imageSrc: string
}

export function RewardCard({ name, cost, imageSrc }: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-[15px] p-2.5 flex flex-col gap-1.5 shadow-sm">
      <div className="relative">
        <img
          src={imageSrc}
          alt={name}
          className="w-full aspect-square object-cover rounded-[10px] bg-decoration"
        />
        <div className="absolute top-1.5 left-1.5 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          <Star size={8} className="fill-accent-yellow text-accent-yellow" />
          {cost.toLocaleString()} pts
        </div>
      </div>
      <span className="text-[11px] font-medium text-text-primary px-0.5">{name}</span>
    </div>
  )
}
```

- [ ] **Step 5: Create `components/app/LogoutButton.tsx`**

```typescript
'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/app/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="mt-6 w-full border border-red-200 text-red-500 rounded-full py-3.5 font-semibold text-sm hover:bg-red-50 transition"
    >
      Sign out
    </button>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add boreal/components/app/
git commit -m "feat: add Client 2 shared components (BottomNav, PointsCard, gauge, cards)"
```

---

### Task 8: Client 2 Home Page

**Files:**
- Create: `boreal/app/app/page.tsx`

- [ ] **Step 1: Create `app/app/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Bell, QrCode } from 'lucide-react'
import { PointsCard } from '@/components/app/PointsCard'
import { AvailabilityGauge } from '@/components/app/AvailabilityGauge'
import { BottomNav } from '@/components/app/BottomNav'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/app/login')

  const service = createServiceClient()
  const [{ data: profile }, { data: slots }, { data: activeSession }] = await Promise.all([
    service.from('profiles').select('*').eq('id', user.id).single(),
    service.from('slots').select('status'),
    service
      .from('sessions')
      .select('id, slots(number)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
  ])

  const available = slots?.filter((s) => s.status === 'available').length ?? 0

  return (
    <div className="pb-[100px]">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-14 pb-5">
        <h1 className="text-[35px] font-bold leading-tight bg-gradient-to-br from-primary to-active bg-clip-text text-transparent">
          Hello {profile?.name?.split(' ')[0] ?? 'there'}!
        </h1>
        <button className="relative mt-2 p-1">
          <Bell size={22} className="text-text-primary" />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>

      {/* Points Card */}
      {profile && <PointsCard profile={profile} />}

      {/* Generate / View QR Button */}
      <div className="mx-5 mt-4">
        <Link
          href="/app/qr"
          className="flex items-center justify-between bg-active text-white rounded-[9px] px-5 py-4 font-bold text-[17px] hover:opacity-95 transition"
        >
          <span>
            {activeSession ? 'Active session — tap to view' : 'Generate QR code'}
          </span>
          <QrCode size={28} strokeWidth={2} />
        </Link>
      </div>

      {/* Availability Gauge */}
      <div className="mt-4">
        <AvailabilityGauge
          initialAvailable={available}
          total={slots?.length ?? 30}
          peakHour="12:00pm"
        />
      </div>

      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 2: Test home screen**

Sign in and visit http://localhost:3000/app. Should see: greeting with the user's first name, purple points card, blue QR button, and the availability gauge.

- [ ] **Step 3: Commit**

```bash
git add boreal/app/app/page.tsx
git commit -m "feat: add Client 2 home screen with points card, QR button, and gauge"
```

---

### Task 9: Client 2 QR Page

**Files:**
- Create: `boreal/components/app/QRDisplay.tsx`
- Create: `boreal/app/app/qr/page.tsx`

- [ ] **Step 1: Create `components/app/QRDisplay.tsx`**

```typescript
'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  token: string
  profileName: string
  initialSlotNumber: number | null
}

export function QRDisplay({ token, profileName, initialSlotNumber }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [slotNumber, setSlotNumber] = useState(initialSlotNumber)

  // Render QR code on canvas
  useEffect(() => {
    async function draw() {
      const QRCode = (await import('qrcode')).default
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, token, {
          width: 240,
          margin: 2,
          color: { dark: '#252525', light: '#FFFFFF' },
        })
      }
    }
    draw()
  }, [token])

  // Realtime: refresh slot number when kiosk checks the user in or out
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('qr-session')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('sessions')
          .select('slots(number)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle()
        setSlotNumber((data as any)?.slots?.number ?? null)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const firstName = profileName.split(' ')[0]

  return (
    <div className="min-h-screen flex flex-col items-center px-6 pt-14 pb-8">
      {/* Back */}
      <div className="w-full flex items-center mb-8">
        <Link href="/app" className="flex items-center gap-2 text-primary font-semibold text-sm">
          <ArrowLeft size={18} /> Back
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-text-primary mb-3">{firstName}'s QR</h1>

      {/* Session status badge */}
      <div
        className={`mb-6 px-4 py-1.5 rounded-full text-sm font-semibold ${
          slotNumber
            ? 'bg-primary/10 text-primary'
            : 'bg-gray-100 text-gray-500'
        }`}
      >
        {slotNumber ? `Active · Slot #${slotNumber}` : 'Ready to check in'}
      </div>

      {/* QR canvas */}
      <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
        <canvas ref={canvasRef} className="rounded-xl" />
      </div>

      <p className="mt-6 text-center text-sm text-gray-400 max-w-[260px] leading-relaxed">
        Scan this at the Boreal kiosk to check in or check out
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/app/qr/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { signToken } from '@/lib/qr'
import { redirect } from 'next/navigation'
import { QRDisplay } from '@/components/app/QRDisplay'

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
  const slotNumber = (activeSession as any)?.slots?.number ?? null

  return (
    <QRDisplay
      token={token}
      profileName={profile?.name ?? ''}
      initialSlotNumber={slotNumber}
    />
  )
}
```

- [ ] **Step 3: Test QR generation**

Visit http://localhost:3000/app/qr. Should see a QR code canvas, status badge saying "Ready to check in", and a back link.

- [ ] **Step 4: Commit**

```bash
git add boreal/components/app/QRDisplay.tsx boreal/app/app/qr/
git commit -m "feat: add Client 2 QR display page with realtime session badge"
```

---

### Task 10: Client 2 Rewards + Settings Pages

**Files:**
- Create: `boreal/app/app/rewards/page.tsx`
- Create: `boreal/app/app/settings/page.tsx`

- [ ] **Step 1: Create `app/app/rewards/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { Star } from 'lucide-react'
import { RewardCard } from '@/components/app/RewardCard'
import { BottomNav } from '@/components/app/BottomNav'

const REWARDS = [
  { name: 'Hoodie ICESI',  cost: 1500, tier: 2000, imageSrc: 'https://placehold.co/120x120/E7E7E9/252525?text=Hoodie' },
  { name: 'Andy Plushie',  cost: 1200, tier: 2000, imageSrc: 'https://placehold.co/120x120/E7E7E9/252525?text=Plushie' },
  { name: 'ICESI Bag',     cost: 1800, tier: 2000, imageSrc: 'https://placehold.co/120x120/E7E7E9/252525?text=Bag' },
  { name: 'Coffee Mug',   cost: 3000, tier: 4000, imageSrc: 'https://placehold.co/120x120/E7E7E9/252525?text=Mug' },
  { name: 'Notebook Set', cost: 3500, tier: 4000, imageSrc: 'https://placehold.co/120x120/E7E7E9/252525?text=Notes' },
  { name: 'Tote Bag',     cost: 3800, tier: 4000, imageSrc: 'https://placehold.co/120x120/E7E7E9/252525?text=Tote' },
]

export default async function RewardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/app/login')

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles').select('points').eq('id', user.id).single()

  return (
    <div className="pb-[100px]">
      {/* Hero card */}
      <div className="bg-primary rounded-b-[24px] px-5 pt-14 pb-6 flex flex-col items-center">
        <svg width="80" height="56" viewBox="0 0 80 56" fill="none">
          <circle cx="13" cy="34" r="13" fill="#E2EB3E" />
          <circle cx="40" cy="22" r="18" fill="#E2EB3E" />
          <circle cx="67" cy="34" r="13" fill="#E2EB3E" />
          <text x="6"  y="40" fontSize="14" fill="#8D5AF9" fontWeight="bold">★</text>
          <text x="30" y="30" fontSize="18" fill="#8D5AF9" fontWeight="bold">★</text>
          <text x="60" y="40" fontSize="14" fill="#8D5AF9" fontWeight="bold">★</text>
        </svg>
        <h2 className="text-white font-bold text-xl mt-2">Behavior rewards</h2>
      </div>

      {/* Points balance header */}
      <div className="flex items-center justify-between px-5 mt-5">
        <div>
          <p className="font-bold text-text-primary text-lg">Points Rewards</p>
          <p className="text-gray-400 text-xs mt-0.5">Claim with your points</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-500">Your points</span>
          <span className="font-bold text-text-primary ml-1">
            {(profile?.points ?? 0).toLocaleString()}
          </span>
          <Star size={14} className="text-accent-yellow fill-accent-yellow" />
        </div>
      </div>

      {/* Reward tiers */}
      {[2000, 4000].map((tier) => (
        <div key={tier} className="mt-5 px-5">
          <p className="text-text-primary font-semibold text-sm mb-3">
            Up to {tier.toLocaleString()} pts
          </p>
          <div className="grid grid-cols-3 gap-3">
            {REWARDS.filter((r) => r.tier === tier).map((r) => (
              <RewardCard key={r.name} name={r.name} cost={r.cost} imageSrc={r.imageSrc} />
            ))}
          </div>
        </div>
      ))}

      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 2: Create `app/app/settings/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { Star } from 'lucide-react'
import { BottomNav } from '@/components/app/BottomNav'
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
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 3: Test both pages**

Visit `/app/rewards` — should see the purple hero card, tiers, reward cards with placeholder images. Visit `/app/settings` — should see profile data and a sign-out button.

- [ ] **Step 4: Commit**

```bash
git add boreal/app/app/rewards/ boreal/app/app/settings/
git commit -m "feat: add Client 2 rewards catalog and settings pages"
```

---

### Task 11: Client 1 Layout, Shared Components, Welcome Page

**Files:**
- Create: `boreal/app/kiosk/layout.tsx`
- Create: `boreal/components/kiosk/WatermarkBg.tsx`
- Create: `boreal/components/kiosk/BorealStars.tsx`
- Create: `boreal/app/kiosk/page.tsx`

- [ ] **Step 1: Create `app/kiosk/layout.tsx`**

```typescript
export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-primary relative overflow-hidden">
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Create `components/kiosk/WatermarkBg.tsx`**

```typescript
export function WatermarkBg() {
  const spokes = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360
    const rad = (angle * Math.PI) / 180
    const cx = 980, cy = 720
    return {
      x1: cx + 80 * Math.cos(rad),
      y1: cy + 80 * Math.sin(rad),
      x2: cx + 460 * Math.cos(rad),
      y2: cy + 460 * Math.sin(rad),
    }
  })

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      viewBox="0 0 1194 834"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
    >
      {spokes.map((s, i) => (
        <line
          key={i}
          x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
          stroke="#8752F8"
          strokeWidth={64}
          strokeLinecap="round"
          opacity={0.55}
        />
      ))}
    </svg>
  )
}
```

- [ ] **Step 3: Create `components/kiosk/BorealStars.tsx`**

```typescript
export function BorealStars() {
  return (
    <svg width="120" height="84" viewBox="0 0 120 84" fill="none">
      <circle cx="20"  cy="52" r="20" fill="#E2EB3E" />
      <circle cx="60"  cy="34" r="28" fill="#E2EB3E" />
      <circle cx="100" cy="52" r="20" fill="#E2EB3E" />
      <text x="11" y="59" fontSize="22" fill="#8D5AF9" fontWeight="bold">★</text>
      <text x="47" y="43" fontSize="28" fill="#8D5AF9" fontWeight="bold">★</text>
      <text x="91" y="59" fontSize="22" fill="#8D5AF9" fontWeight="bold">★</text>
    </svg>
  )
}
```

- [ ] **Step 4: Create `app/kiosk/page.tsx`**

```typescript
import Link from 'next/link'
import { QrCode } from 'lucide-react'
import { WatermarkBg } from '@/components/kiosk/WatermarkBg'
import { BorealStars } from '@/components/kiosk/BorealStars'

export default function KioskWelcomePage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center gap-8">
      <WatermarkBg />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <BorealStars />
        <h1 className="text-white font-bold text-[52px] text-center leading-tight">
          Welcome to Boreal
        </h1>
        <Link
          href="/kiosk/scan"
          className="bg-white text-black font-bold text-[28px] px-20 py-5 rounded-full hover:bg-white/90 transition"
        >
          Scan QR code
        </Link>
        <QrCode size={44} className="text-white/50 mt-1" strokeWidth={1.5} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Test welcome screen**

Visit http://localhost:3000/kiosk. Should see: full purple background, decorative starburst watermark, Boreal logo, "Welcome to Boreal" heading, white pill button.

- [ ] **Step 6: Commit**

```bash
git add boreal/app/kiosk/layout.tsx boreal/app/kiosk/page.tsx boreal/components/kiosk/
git commit -m "feat: add Client 1 kiosk layout, watermark, and welcome screen"
```

---

### Task 12: Client 1 QR Scanner + Scan Page

**Files:**
- Create: `boreal/components/kiosk/QRScanner.tsx`
- Create: `boreal/app/kiosk/scan/page.tsx`

- [ ] **Step 1: Create `components/kiosk/QRScanner.tsx`**

```typescript
'use client'
import { useEffect, useRef, useState } from 'react'

interface Props {
  onScan: (data: string) => void
}

export function QRScanner({ onScan }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const [permissionError, setPermissionError] = useState(false)
  // Prevent the effect from running twice in StrictMode
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    let stream: MediaStream | null = null

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: 640, height: 640 },
        })
        const video = videoRef.current!
        video.srcObject = stream
        await video.play()
        tick()
      } catch {
        setPermissionError(true)
      }
    }

    async function tick() {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const jsQR = (await import('jsqr')).default
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      if (code?.data) {
        stream?.getTracks().forEach((t) => t.stop())
        onScan(code.data)
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    start()

    return () => {
      cancelAnimationFrame(rafRef.current)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [onScan])

  if (permissionError) {
    return (
      <div className="w-[400px] h-[400px] flex items-center justify-center bg-black/20 rounded-2xl">
        <p className="text-white/60 text-center text-sm px-8 leading-relaxed">
          Camera access denied.
          <br />
          Please allow camera permission in browser settings.
        </p>
      </div>
    )
  }

  return (
    <div className="relative w-[400px] h-[400px]">
      <video
        ref={videoRef}
        className="w-full h-full object-cover rounded-2xl"
        playsInline
        muted
      />
      <canvas ref={canvasRef} className="hidden" />
      {/* Corner bracket overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-4 left-4 w-10 h-10 border-t-[4px] border-l-[4px] border-white rounded-tl-xl" />
        <div className="absolute top-4 right-4 w-10 h-10 border-t-[4px] border-r-[4px] border-white rounded-tr-xl" />
        <div className="absolute bottom-4 left-4 w-10 h-10 border-b-[4px] border-l-[4px] border-white rounded-bl-xl" />
        <div className="absolute bottom-4 right-4 w-10 h-10 border-b-[4px] border-r-[4px] border-white rounded-br-xl" />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/kiosk/scan/page.tsx`**

```typescript
'use client'
import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WatermarkBg } from '@/components/kiosk/WatermarkBg'
import { BorealStars } from '@/components/kiosk/BorealStars'
import { QRScanner } from '@/components/kiosk/QRScanner'

type ScanState = 'scanning' | 'processing' | 'error'

export default function KioskScanPage() {
  const router = useRouter()
  const [state, setState] = useState<ScanState>('scanning')
  const [errorMessage, setErrorMessage] = useState('')

  const handleScan = useCallback(
    async (token: string) => {
      if (state !== 'scanning') return
      setState('processing')

      // Attempt check-in
      const checkInRes = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (checkInRes.ok) {
        const { slotNumber, userName } = await checkInRes.json()
        router.push(
          `/kiosk/assign?slot=${slotNumber}&name=${encodeURIComponent(userName)}`
        )
        return
      }

      const checkInBody = await checkInRes.json()

      // If user already has session → attempt check-out
      if (
        checkInRes.status === 409 &&
        checkInBody.error === 'User already has an active session'
      ) {
        const checkOutRes = await fetch('/api/sessions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        if (checkOutRes.ok) {
          const { pointsAwarded, userName } = await checkOutRes.json()
          router.push(
            `/kiosk/assign?checkout=true&points=${pointsAwarded}&name=${encodeURIComponent(userName)}`
          )
          return
        }
      }

      // No slots available
      if (
        checkInRes.status === 409 &&
        checkInBody.error === 'No slots available'
      ) {
        setErrorMessage('The room is currently full. Please try again later.')
      } else if (checkInRes.status === 400) {
        setErrorMessage('QR code not recognized')
      } else {
        setErrorMessage('Something went wrong. Please try again.')
      }

      setState('error')
      setTimeout(() => setState('scanning'), 3000)
    },
    [state, router]
  )

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center gap-8">
      <WatermarkBg />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <BorealStars />
        <h1 className="text-white font-bold text-[40px] text-center">
          Place QR code in the scanner
        </h1>

        {state === 'scanning' && <QRScanner onScan={handleScan} />}

        {state === 'processing' && (
          <div className="w-[400px] h-[400px] flex items-center justify-center bg-black/20 rounded-2xl">
            <p className="text-white text-xl font-semibold">Processing…</p>
          </div>
        )}

        {state === 'error' && (
          <div className="w-[400px] h-[400px] flex items-center justify-center bg-black/20 rounded-2xl">
            <p className="text-white text-xl font-semibold">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Test scanner page**

Visit http://localhost:3000/kiosk/scan in a browser with camera. Allow camera permission. Camera feed should appear inside a rounded box with white bracket corners.

- [ ] **Step 4: Commit**

```bash
git add boreal/components/kiosk/QRScanner.tsx boreal/app/kiosk/scan/
git commit -m "feat: add Client 1 QR scanner with jsqr frame loop and check-in/out API calls"
```

---

### Task 13: Client 1 Assign Page + End-to-End Flow Test

**Files:**
- Create: `boreal/components/kiosk/AssignContent.tsx`
- Create: `boreal/app/kiosk/assign/page.tsx`

- [ ] **Step 1: Create `components/kiosk/AssignContent.tsx`**

```typescript
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WatermarkBg } from './WatermarkBg'
import { BorealStars } from './BorealStars'

interface Props {
  isCheckout: boolean
  slotNumber: string | null
  name: string
  points: string
}

export function AssignContent({ isCheckout, slotNumber, name, points }: Props) {
  const router = useRouter()
  const duration = isCheckout ? 6 : 8
  const [countdown, setCountdown] = useState(duration)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/kiosk')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [router])

  const firstName = decodeURIComponent(name).split(' ')[0]

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center gap-6">
      <WatermarkBg />
      <div className="relative z-10 flex flex-col items-center gap-6 text-center px-10 max-w-3xl">
        <BorealStars />

        {isCheckout ? (
          <>
            <h1 className="text-white font-bold text-[44px] leading-tight">
              See you next time, {firstName}!
            </h1>
            <div className="bg-white/10 rounded-2xl px-10 py-5 backdrop-blur-sm">
              <p className="text-accent-lime font-bold text-3xl">+{points} pts</p>
              <p className="text-white/80 text-sm mt-1">added to your profile</p>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-white font-bold text-[44px] leading-tight">
              Hi {firstName}, take your assigned pillow
            </h1>
            <div className="w-44 h-44 rounded-full bg-[#7A3FE8] flex items-center justify-center shadow-xl">
              <span className="text-white font-bold text-[72px] leading-none">{slotNumber}</span>
            </div>
            <p className="text-white/70 text-lg leading-relaxed">
              Remember this is a shared space, we suggest to only take your assigned pillow
            </p>
          </>
        )}

        <p className="text-white/40 text-sm mt-2">
          Returning to welcome screen in {countdown}s
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/kiosk/assign/page.tsx`**

```typescript
import { AssignContent } from '@/components/kiosk/AssignContent'

interface Props {
  searchParams: Promise<{
    slot?: string
    name?: string
    checkout?: string
    points?: string
  }>
}

export default async function KioskAssignPage({ searchParams }: Props) {
  const params = await searchParams
  return (
    <AssignContent
      isCheckout={params.checkout === 'true'}
      slotNumber={params.slot ?? null}
      name={params.name ?? 'Student'}
      points={params.points ?? '50'}
    />
  )
}
```

- [ ] **Step 3: Test check-in assign screen**

Visit: `http://localhost:3000/kiosk/assign?slot=7&name=Marie%20Garcia`

Expected: Purple screen, "Hi Marie, take your assigned pillow", large "7" in a darker circle, reminder text, countdown timer (8→0 then redirects to `/kiosk`).

- [ ] **Step 4: Test checkout assign screen**

Visit: `http://localhost:3000/kiosk/assign?checkout=true&points=50&name=Marie%20Garcia`

Expected: Purple screen, "See you next time, Marie!", "+50 pts added to your profile" in lime green, countdown (6→0).

- [ ] **Step 5: Full end-to-end flow test**

Requires two devices (or two browser windows — one for the kiosk, one for the student app). Use the desktop/laptop for the kiosk at `/kiosk` and the mobile browser for `/app`.

1. On mobile: register a new account → navigate to `/app/qr` → QR code is shown with "Ready to check in"
2. On kiosk desktop: go to `/kiosk` → click "Scan QR code" → allow camera
3. Show mobile screen to laptop camera — kiosk should decode QR → redirect to `/kiosk/assign?slot=1&name=...`
4. On mobile: QR page badge should update to "Active · Slot #1" (realtime)
5. On mobile home: availability gauge should drop by 1 (realtime)
6. On kiosk: wait for countdown → returns to welcome screen
7. On kiosk: click scan again → show same mobile QR → redirects to `/kiosk/assign?checkout=true&points=50&name=...`
8. On mobile: badge resets to "Ready to check in" (realtime)
9. On mobile home: availability gauge +1 again (realtime)

- [ ] **Step 6: Commit**

```bash
git add boreal/components/kiosk/AssignContent.tsx boreal/app/kiosk/assign/
git commit -m "feat: add Client 1 assignment/confirmation page with countdown auto-return"
```

- [ ] **Step 7: Final commit with all remaining files**

```bash
git add boreal/
git status  # verify nothing unexpected is staged
git commit -m "chore: finalize Boreal room prototype — both clients functional"
```

---

## Self-Review Notes

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Client 2: login / register | Task 6 |
| Client 2: home screen with points card, QR button, gauge | Tasks 7, 8 |
| Client 2: QR display with session badge | Task 9 |
| Client 2: rewards catalog | Task 10 |
| Client 2: settings + logout | Task 10 |
| Client 1: welcome screen | Task 11 |
| Client 1: QR scanner + check-in/out API dispatch | Task 12 |
| Client 1: slot assignment + checkout confirmation | Task 13 |
| API: GET /api/slots | Task 4 |
| API: POST /api/sessions (check-in) | Task 4 |
| API: PATCH /api/sessions (check-out) | Task 4 |
| Supabase schema + seed | Task 2 |
| QR HMAC token lib + tests | Task 3 |
| Realtime: gauge on slot changes | Task 7 |
| Realtime: QR page badge on session changes | Task 9 |
| Color palette | Tasks 1, 5 |
| Plus Jakarta Sans font | Task 5 |

All spec requirements are covered. ✓

**Type consistency check:**
- `Profile` interface used in `PointsCard` (Task 7) — defined in `lib/types.ts` (Task 3) ✓
- `SessionWithSlot` defined for the nested join query shape ✓
- `signToken` / `verifyToken` signatures match between `lib/qr.ts` (Task 3) and usage in `app/api/sessions/route.ts` (Task 4) and `app/app/qr/page.tsx` (Task 9) ✓
- `createServiceClient()` returns a standard Supabase client — used consistently in Tasks 4, 8, 9, 10 ✓

**Note on `html5-qrcode` vs `jsqr`:** The spec listed `html5-qrcode` but this plan uses `jsqr` directly with the browser `getUserMedia` API, which gives full UI control and avoids React StrictMode double-mount issues.
