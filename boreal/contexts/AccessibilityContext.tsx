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
