import { Camera, ImageOff, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Boton } from './ui'

/**
 * Cámara en vivo del dispositivo. No permite elegir imágenes de la galería:
 * la foto solo puede tomarse en el momento de la visita.
 */
export function Camara({ onFoto, onSinCamara }: { onFoto: (dataUrl: string) => void; onSinCamara: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const [estado, setEstado] = useState<'abriendo' | 'lista' | 'error'>('abriendo')
  const [captura, setCaptura] = useState<string | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null
    let cancelado = false
    if (!navigator.mediaDevices?.getUserMedia) {
      setEstado('error')
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false })
      .then((s) => {
        if (cancelado) return s.getTracks().forEach((t) => t.stop())
        stream = s
        if (video.current) {
          video.current.srcObject = s
          void video.current.play()
        }
        setEstado('lista')
      })
      .catch(() => setEstado('error'))
    return () => {
      cancelado = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const tomar = () => {
    const v = video.current
    if (!v) return
    const ancho = 720
    const alto = Math.round((v.videoHeight / v.videoWidth) * ancho) || 540
    const c = document.createElement('canvas')
    c.width = ancho
    c.height = alto
    c.getContext('2d')!.drawImage(v, 0, 0, ancho, alto)
    setCaptura(c.toDataURL('image/jpeg', 0.7))
  }

  if (estado === 'error') {
    return (
      <div className="rounded-2xl bg-white p-6 text-center">
        <ImageOff className="mx-auto text-gris" size={32} aria-hidden />
        <p className="mt-3 font-semibold">No pudimos abrir la cámara</p>
        <p className="mt-1 text-sm text-gris">Revisa el permiso de cámara del navegador. Para continuar la demo puedes usar una foto de ejemplo.</p>
        <Boton className="mt-4 w-full" variante="secundario" onClick={onSinCamara}>
          Usar foto de demostración
        </Boton>
      </div>
    )
  }

  return (
    <div>
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-tinta">
        <video ref={video} playsInline muted className={`h-full w-full object-cover ${captura ? 'hidden' : ''}`} />
        {captura && <img src={captura} alt="Foto tomada" className="h-full w-full object-cover" />}
        {estado === 'abriendo' && <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">Abriendo cámara…</div>}
      </div>
      {captura ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Boton variante="secundario" onClick={() => setCaptura(null)}>
            <RotateCcw size={16} aria-hidden /> Repetir
          </Boton>
          <Boton onClick={() => onFoto(captura)}>Usar esta foto</Boton>
        </div>
      ) : (
        <Boton className="mt-3 w-full py-3.5" onClick={tomar} disabled={estado !== 'lista'}>
          <Camera size={18} aria-hidden /> Tomar foto
        </Boton>
      )}
      <p className="mt-2 text-center text-xs text-gris">Solo se aceptan fotos tomadas en este momento. La galería está deshabilitada.</p>
    </div>
  )
}
