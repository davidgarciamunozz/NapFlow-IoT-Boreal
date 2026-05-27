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
  // Prevent double-mount in StrictMode
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
