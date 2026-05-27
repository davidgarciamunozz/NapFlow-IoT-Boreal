# Boreal Room System — Design Spec

**Date:** 2026-05-27  
**Status:** Approved  
**Scope:** UI prototype with functional check-in/check-out flows. Microcontroller integration deferred.

---

## 1. Problem Summary

The Boreal Room at Icesi University is a shared relaxation space suffering from resource hoarding. Students occupy multiple mats/pillows simultaneously because there are no enforcement mechanisms and peer confrontation is avoided. This system automates fairness through a two-client digital ecosystem and a behavioral points incentive.

---

## 2. Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS |
| Font | Plus Jakarta Sans |
| Backend / DB | Supabase (Postgres) |
| Auth | Supabase email + password |
| Real-time | Supabase Realtime subscriptions |
| QR generation | `qrcode` npm package |
| QR scanning | `html5-qrcode` (camera, browser-based) |
| Deployment | Vercel (single project) |

---

## 3. Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#8D5AF9` | Kiosk bg, mobile widget cards |
| `--color-active` | `#5353EE` | Mobile active tab, Generate QR button |
| `--color-accent-yellow` | `#E2EB3E` | Kiosk star SVG icons |
| `--color-accent-lime` | `#C1F52E` | Availability gauge fill |
| `--color-watermark` | `#8752F8` | Kiosk bg watermark decoration |
| `--color-decoration` | `#E7E7E9` | Mobile bg SVG decorations |
| `--color-text-primary` | `#252525` | Mobile dark text |
| `--color-text-white` | `#FFFFFF` | Kiosk text, mobile card text |

---

## 4. Project Structure

```
boreal/
├── app/
│   ├── app/                        ← Client 2 (student mobile, white bg)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── (home)/page.tsx         ← Home screen
│   │   ├── qr/page.tsx             ← Active QR display
│   │   ├── rewards/page.tsx        ← Rewards catalog
│   │   └── settings/page.tsx
│   ├── kiosk/                      ← Client 1 (iPad kiosk, purple bg)
│   │   ├── page.tsx                ← Welcome / idle
│   │   ├── scan/page.tsx           ← Camera QR scanner
│   │   └── assign/page.tsx         ← Slot assignment result
│   └── api/
│       ├── sessions/route.ts       ← POST (check-in), PATCH (check-out)
│       └── slots/route.ts          ← GET availability count
├── lib/
│   ├── supabase/
│   │   ├── client.ts               ← Browser Supabase client
│   │   └── server.ts               ← Server Supabase client
│   └── qr.ts                       ← QR payload encode/decode helpers
└── components/
    ├── app/                        ← Client 2 components
    │   ├── PointsCard.tsx
    │   ├── AvailabilityGauge.tsx
    │   ├── BottomNav.tsx
    │   └── RewardCard.tsx
    └── kiosk/                      ← Client 1 components
        ├── WatermarkBg.tsx
        └── QRScanner.tsx
```

---

## 5. Data Model

### `profiles`
```sql
id          uuid  PRIMARY KEY references auth.users
name        text  NOT NULL
email       text  NOT NULL
points      int   NOT NULL DEFAULT 0
streak_days int   NOT NULL DEFAULT 0
created_at  timestamptz DEFAULT now()
```

### `slots`
```sql
id      uuid    PRIMARY KEY DEFAULT gen_random_uuid()
number  int     NOT NULL UNIQUE  -- 1 to 30
status  text    NOT NULL DEFAULT 'available'  -- 'available' | 'occupied'
```

### `sessions`
```sql
id             uuid  PRIMARY KEY DEFAULT gen_random_uuid()
user_id        uuid  NOT NULL references profiles(id)
slot_id        uuid  NOT NULL references slots(id)
status         text  NOT NULL DEFAULT 'active'  -- 'active' | 'closed'
checked_in_at  timestamptz DEFAULT now()
checked_out_at timestamptz
-- sensor_confirmed bool  ← added later when microcontrollers are integrated
```

### `point_events`
```sql
id          uuid  PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid  NOT NULL references profiles(id)
session_id  uuid  references sessions(id)
delta       int   NOT NULL  -- +50 successful return, -20 non-compliance
reason      text            -- 'successful_return' | 'non_compliance'
created_at  timestamptz DEFAULT now()
```

**Realtime subscriptions:**
- `slots` table → Client 2 home availability gauge updates live
- `sessions` table (filtered by user_id) → Client 2 QR page status updates live

---

## 6. Client 2 — Student Mobile App (`/app/*`)

All screens: white background, `#E7E7E9` decorative SVGs, Plus Jakarta Sans.

### 6.1 Login (`/app/login`)
- Email + password fields
- "Sign in" button (purple `#8D5AF9`)
- Link to `/app/register`
- On success → redirect to `/app`

### 6.2 Register (`/app/register`)
- Name, email, password fields
- Creates Supabase auth user + inserts row into `profiles`
- On success → redirect to `/app`

### 6.3 Home (`/app`)
- Top: greeting "Hello [Name]!" with gradient text (`#8D5AF9` → `#5454E9`), bell notification icon
- **Points Card** (purple `#8D5AF9`, rounded): points balance, streak badge, milestone progress bar (Keycharm 500pts → Pen 1000pts → Pencil Case 2000pts)
- **Generate QR Code button** (`#5353EE`, full-width pill):
  - If no active session → generates QR, navigates to `/app/qr`
  - If active session → button reads "Active session — tap to view" → navigates to `/app/qr`
- **Availability card** (white, border): radial gauge with lime `#C1F52E` fill, large available spots number, peak demand hint
- Bottom nav: Rewards | Home (active, `#5353EE` pill) | Settings

### 6.4 QR Screen (`/app/qr`)
- Centered QR code (encodes a signed identity token: `{userId, issuedAt}` + HMAC signature using a server secret — no session ID embedded, since the session doesn't exist yet at QR generation time)
- The kiosk uses the userId in the token to look up any existing active session on each scan
- Session status badge: "Active · Slot #[N]" if session is active, or "Ready to check in" if no active session
- Hint: "Scan this at the Boreal kiosk to check in or check out"
- **One QR per user:** the same token is reused across check-in and check-out; it encodes identity, not a session
- Back button → home

### 6.5 Rewards (`/app/rewards`)
- "Behavior rewards" hero card (purple, with star SVGs)
- Recent rewards row (horizontal scroll, 3 items visible + "view all")
- "Points Rewards / Claim with your points" section header + user's points balance
- Grid of reward cards grouped by tier: "Up to 2,000 pts" / "Up to 4,000 pts"
- Each reward card: image, name, cost badge (star icon + pts)
- Bottom nav: Rewards (active) | Home | Settings

### 6.6 Settings (`/app/settings`)
- Display name, email (read-only)
- Points balance
- Logout button

---

## 7. Client 1 — iPad Kiosk (`/kiosk/*`)

All screens: full-bleed purple `#8D5AF9` background, `#8752F8` watermark SVG (star/decorative shape, low opacity), white text, Plus Jakarta Sans Bold.

### 7.1 Welcome / Idle (`/kiosk`)
- Boreal logo (3-stars icon, `#E2EB3E`)
- "Welcome to Boreal" heading (white, large)
- "Scan QR code" white pill button (black font) → navigates to `/kiosk/scan`
- Small QR icon below button

### 7.2 Scanning (`/kiosk/scan`)
- "Place QR code in the scanner" heading (white)
- Live camera feed in a rounded square with bracket-corner QR frame overlay (white corners)
- Uses `html5-qrcode` — requests camera permission on mount
- On successful QR decode:
  1. Validate token (not expired, not already used)
  2. Look up user + session in Supabase
  3. **Check-in path:** no active session → find the lowest-numbered available slot → create session → mark slot `occupied` → navigate to `/kiosk/assign?slot=N&name=Marie`
  4. **Check-out path:** active session exists → close session → award +50 points → mark slot `available` → navigate to `/kiosk/assign?checkout=true&name=Marie&points=50`
- On invalid QR → show inline error "QR code not recognized" for 3s, resume scanning

### 7.3 Slot Assignment / Confirmation (`/kiosk/assign`)
- **Check-in variant:**
  - "Hi [Name], take your assigned pillow"
  - Large slot number in a circle (purple-dark `#7A3FE8`)
  - "Remember this is a shared space, we suggest to only take your assigned pillow"
  - Auto-returns to `/kiosk` after 8 seconds (countdown visible)
- **Check-out variant:**
  - "See you next time, [Name]!"
  - "+50 pts added to your profile" (lime accent)
  - Star animation
  - Auto-returns to `/kiosk` after 6 seconds

---

## 8. API Routes

### `POST /api/sessions` — Check-in
- Body: `{ token: string }` (decoded QR payload)
- Validates token, finds next available slot, creates session, marks slot occupied
- Returns: `{ sessionId, slotNumber, userName }`

### `PATCH /api/sessions` — Check-out
- Body: `{ token: string }`
- Validates active session, closes it, awards points, marks slot available
- Returns: `{ pointsAwarded, newTotal, userName }`

### `GET /api/slots` — Availability
- Returns: `{ available: number, total: number, peakHour: string }`

---

## 9. Session Flows

### Check-in
```
Student opens /app/qr → QR displayed
  ↓
Kiosk scans QR → POST /api/sessions
  ↓
Supabase: create session (active), slot → occupied
  ↓
Kiosk shows /kiosk/assign (slot number)
  ↓
Client 2 home gauge updates via Realtime (available spots -1)
```

### Check-out
```
Student shows QR at kiosk again
  ↓
Kiosk scans QR → PATCH /api/sessions
  ↓
Supabase: session → closed, slot → available, +50 point_event
  ↓
Kiosk shows /kiosk/assign (checkout confirmation)
  ↓
Client 2 QR page invalidates, home gauge updates (+1 available)
```

### Sensor integration (future)
When microcontrollers are added: `PATCH /api/sessions` will check `sensor_confirmed` on the slot before awarding points. If `false`, session closes but applies `delta: -20` instead of `+50`. The API route already accepts an optional `sensorConfirmed` field; the kiosk UI will handle both success and failure variants of the checkout screen.

---

## 10. Out of Scope (this sprint)

- Microcontroller / sensor integration
- Admin dashboard
- Push notifications
- Reward redemption flow (catalog is display-only)
- Peak demand prediction (hardcoded "12:00pm" for now)
