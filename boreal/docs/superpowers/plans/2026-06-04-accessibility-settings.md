# Accessibility Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dark mode, font size control, and high-contrast toggle to the student app settings page, persisted in localStorage and applied globally via CSS classes on `<html>`.

**Architecture:** A client-side `AccessibilityProvider` context reads preferences from localStorage on mount, writes them back on change, and mutates `document.documentElement` (classes + data attributes) so that CSS overrides in `globals.css` take effect globally without touching any existing component. The settings page gets a new `AccessibilitySettings` client component that renders the three controls inside a card matching the existing design.

**Tech Stack:** Next.js 15 App Router, React context, Tailwind CSS v4 (`@theme`), localStorage

---

## File Map

| Action   | Path                                         | Responsibility                                              |
|----------|----------------------------------------------|-------------------------------------------------------------|
| Modify   | `app/globals.css`                            | Add dark / font-size / high-contrast CSS variable overrides |
| Create   | `contexts/AccessibilityContext.tsx`          | Context, provider, `useAccessibility` hook                  |
| Modify   | `app/layout.tsx`                             | Wrap body children with `AccessibilityProvider`             |
| Create   | `components/app/AccessibilitySettings.tsx`   | Settings UI — toggles and font-size picker                  |
| Modify   | `app/app/settings/page.tsx`                  | Add `<AccessibilitySettings />` below the profile card      |

---

### Task 1: Add CSS overrides for all three accessibility modes

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Open `app/globals.css` and append the following block after the existing `@theme` block**

```css
/* ── Accessibility: Dark Mode ─────────────────────────────── */
html.dark {
  --color-text-primary: #e8e8f0;
  --color-decoration: #2d2d3d;
  --color-primary: #a87aff;
  --color-active: #7575ff;
  --color-watermark: #a87aff;
}

html.dark body {
  background-color: #1a1a2e;
  color: #e8e8f0;
}

html.dark .bg-white {
  background-color: #252535 !important;
}

html.dark .border-gray-100,
html.dark .divide-gray-100 > * + * {
  border-color: #3a3a4a !important;
}

html.dark .text-gray-400 {
  color: #8888a0 !important;
}

html.dark .bg-gray-100 {
  background-color: #2d2d3d !important;
}

html.dark .text-gray-500 {
  color: #9999b0 !important;
}

html.dark .bg-decoration {
  background-color: #2d2d3d !important;
}

/* Bottom nav dark adjustments */
html.dark nav.bg-white {
  background-color: #252535 !important;
  border-color: #3a3a4a !important;
}

/* ── Accessibility: Font Size ─────────────────────────────── */
html[data-font="1"] {
  font-size: 18px;
}

html[data-font="2"] {
  font-size: 21px;
}

/* ── Accessibility: High Contrast ────────────────────────── */
html.high-contrast {
  --color-text-primary: #000000;
  --color-primary: #3a00b3;
  --color-active: #0000b3;
  --color-decoration: #c0c0c0;
}

html.high-contrast .text-gray-400,
html.high-contrast .text-gray-500 {
  color: #444444 !important;
}

html.high-contrast.dark {
  --color-text-primary: #ffffff;
  --color-primary: #cc99ff;
  --color-active: #9999ff;
}

html.high-contrast.dark .text-gray-400,
html.high-contrast.dark .text-gray-500 {
  color: #bbbbcc !important;
}
```

- [ ] **Step 2: Verify the app still builds with no CSS errors**

```bash
cd /Users/david/Desktop/INV/boreal && npm run build 2>&1 | tail -20
```

Expected: build succeeds (exit 0).

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(a11y): add dark, font-size, high-contrast CSS overrides"
```

---

### Task 2: Create the AccessibilityContext

**Files:**
- Create: `contexts/AccessibilityContext.tsx`

- [ ] **Step 1: Create `contexts/AccessibilityContext.tsx` with the following content**

```tsx
'use client'
import { createContext, useContext, useEffect, useState } from 'react'

export type FontSize = 0 | 1 | 2   // 0 = normal, 1 = large, 2 = extra-large

interface AccessibilityState {
  darkMode: boolean
  fontSize: FontSize
  highContrast: boolean
  setDarkMode: (v: boolean) => void
  setFontSize: (v: FontSize) => void
  setHighContrast: (v: boolean) => void
}

const AccessibilityContext = createContext<AccessibilityState | null>(null)

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkModeState] = useState(false)
  const [fontSize, setFontSizeState] = useState<FontSize>(0)
  const [highContrast, setHighContrastState] = useState(false)

  // Load from localStorage on mount and apply to <html>
  useEffect(() => {
    const dark = localStorage.getItem('boreal_dark') === '1'
    const font = (Number(localStorage.getItem('boreal_font')) || 0) as FontSize
    const contrast = localStorage.getItem('boreal_contrast') === '1'

    setDarkModeState(dark)
    setFontSizeState(font)
    setHighContrastState(contrast)

    applyToHtml(dark, font, contrast)
  }, [])

  const setDarkMode = (v: boolean) => {
    localStorage.setItem('boreal_dark', v ? '1' : '0')
    setDarkModeState(v)
    applyToHtml(v, fontSize, highContrast)
  }

  const setFontSize = (v: FontSize) => {
    localStorage.setItem('boreal_font', String(v))
    setFontSizeState(v)
    applyToHtml(darkMode, v, highContrast)
  }

  const setHighContrast = (v: boolean) => {
    localStorage.setItem('boreal_contrast', v ? '1' : '0')
    setHighContrastState(v)
    applyToHtml(darkMode, fontSize, v)
  }

  return (
    <AccessibilityContext.Provider value={{ darkMode, fontSize, highContrast, setDarkMode, setFontSize, setHighContrast }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext)
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider')
  return ctx
}

function applyToHtml(dark: boolean, font: FontSize, contrast: boolean) {
  const html = document.documentElement
  html.classList.toggle('dark', dark)
  html.classList.toggle('high-contrast', contrast)
  if (font === 0) {
    html.removeAttribute('data-font')
  } else {
    html.setAttribute('data-font', String(font))
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add contexts/AccessibilityContext.tsx
git commit -m "feat(a11y): add AccessibilityContext with localStorage persistence"
```

---

### Task 3: Wire AccessibilityProvider into the root layout

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update `app/layout.tsx`**

Replace the entire file with:

```tsx
import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { AccessibilityProvider } from '@/contexts/AccessibilityContext'
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} font-sans antialiased`}>
        <AccessibilityProvider>
          {children}
        </AccessibilityProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Verify the app builds**

```bash
cd /Users/david/Desktop/INV/boreal && npm run build 2>&1 | tail -20
```

Expected: build succeeds (exit 0).

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(a11y): wire AccessibilityProvider into root layout"
```

---

### Task 4: Create the AccessibilitySettings UI component

**Files:**
- Create: `components/app/AccessibilitySettings.tsx`

- [ ] **Step 1: Create `components/app/AccessibilitySettings.tsx`**

```tsx
'use client'
import { useAccessibility, type FontSize } from '@/contexts/AccessibilityContext'

const FONT_OPTIONS: { label: string; value: FontSize }[] = [
  { label: 'Normal', value: 0 },
  { label: 'Large', value: 1 },
  { label: 'X-Large', value: 2 },
]

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        enabled ? 'bg-active' : 'bg-decoration'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export function AccessibilitySettings() {
  const { darkMode, fontSize, highContrast, setDarkMode, setFontSize, setHighContrast } = useAccessibility()

  return (
    <div className="mt-6">
      <h2 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
        Accessibility
      </h2>
      <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-100 shadow-sm">

        {/* Dark Mode */}
        <div className="px-4 py-3.5 flex items-center justify-between">
          <div>
            <p className="font-medium text-text-primary">Dark Mode</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Switch to a darker color scheme</p>
          </div>
          <Toggle enabled={darkMode} onToggle={() => setDarkMode(!darkMode)} />
        </div>

        {/* Font Size */}
        <div className="px-4 py-3.5">
          <p className="font-medium text-text-primary mb-2.5">Font Size</p>
          <div className="flex gap-2">
            {FONT_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setFontSize(value)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  fontSize === value
                    ? 'bg-active text-white'
                    : 'bg-decoration text-text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* High Contrast */}
        <div className="px-4 py-3.5 flex items-center justify-between">
          <div>
            <p className="font-medium text-text-primary">High Contrast</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Increase color contrast for readability</p>
          </div>
          <Toggle enabled={highContrast} onToggle={() => setHighContrast(!highContrast)} />
        </div>

      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/app/AccessibilitySettings.tsx
git commit -m "feat(a11y): add AccessibilitySettings UI component"
```

---

### Task 5: Add AccessibilitySettings to the settings page

**Files:**
- Modify: `app/app/settings/page.tsx`

- [ ] **Step 1: Update `app/app/settings/page.tsx`**

Replace the entire file with:

```tsx
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { Star } from 'lucide-react'
import { LogoutButton } from '@/components/app/LogoutButton'
import { AccessibilitySettings } from '@/components/app/AccessibilitySettings'

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

      <AccessibilitySettings />

      <LogoutButton />
    </div>
  )
}
```

- [ ] **Step 2: Start the dev server and verify the settings page renders correctly**

```bash
cd /Users/david/Desktop/INV/boreal && npm run dev
```

Open `http://localhost:3000/app/settings` and verify:
- "Accessibility" section appears below the profile card
- Dark Mode toggle turns on dark mode across the app
- Font size buttons cycle through Normal / Large / X-Large
- High Contrast toggle changes color contrast
- All three settings persist across page refreshes

- [ ] **Step 3: Commit**

```bash
git add app/app/settings/page.tsx
git commit -m "feat(a11y): add AccessibilitySettings section to settings page"
```
