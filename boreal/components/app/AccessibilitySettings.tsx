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
