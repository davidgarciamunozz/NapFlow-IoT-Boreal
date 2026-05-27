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
