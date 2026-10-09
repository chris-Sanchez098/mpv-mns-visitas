import { CheckCircle2, CircleDashed, CircleSlash, CalendarClock, X, MapPinOff } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { ESTADO_NOMBRE, type Estado } from '../data/types'
import { useDemo } from '../store'

const ESTILO_ESTADO: Record<Estado, { clase: string; Icono: typeof CheckCircle2 }> = {
  realizada: { clase: 'bg-hoja-50 text-hoja', Icono: CheckCircle2 },
  programada: { clase: 'bg-cobalto-50 text-cobalto', Icono: CircleDashed },
  no_realizada: { clase: 'bg-alerta-50 text-alerta', Icono: CircleSlash },
  reprogramada: { clase: 'bg-ambar-50 text-ambar', Icono: CalendarClock },
}

export function EstadoChip({ estado, pequeño }: { estado: Estado; pequeño?: boolean }) {
  const { clase, Icono } = ESTILO_ESTADO[estado]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap ${clase} ${pequeño ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'}`}>
      <Icono size={pequeño ? 12 : 14} aria-hidden />
      {ESTADO_NOMBRE[estado]}
    </span>
  )
}

export function FueraDeRango({ distancia }: { distancia?: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-alerta-50 px-2 py-0.5 text-xs font-medium text-alerta whitespace-nowrap">
      <MapPinOff size={12} aria-hidden />
      Fuera de rango{distancia ? ` · ${distancia.toLocaleString('es-CO')} m` : ''}
    </span>
  )
}

export function Modal({ titulo, onCerrar, children, ancho = 'max-w-lg' }: { titulo: string; onCerrar: () => void; children: ReactNode; ancho?: string }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onCerrar])
  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-tinta/40 p-0 sm:items-center sm:p-6" onClick={onCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`max-h-[92vh] w-full ${ancho} overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-linea bg-white px-5 py-4">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button onClick={onCerrar} className="rounded-lg p-1.5 text-gris hover:bg-niebla" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Avisos() {
  const avisos = useDemo((s) => s.avisos)
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[2000] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {avisos.map((a) => (
        <div key={a.id} className="pointer-events-auto flex items-center gap-2 rounded-xl bg-tinta px-4 py-3 text-sm text-white shadow-lg">
          <CheckCircle2 size={16} className="text-[#7cc68b]" aria-hidden />
          {a.texto}
        </div>
      ))}
    </div>
  )
}

export function Campo({ etiqueta, children, ayuda }: { etiqueta: string; children: ReactNode; ayuda?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-tinta">{etiqueta}</span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-gris">{ayuda}</span>}
    </label>
  )
}

export const claseInput =
  'w-full rounded-xl border border-linea bg-white px-3 py-2.5 text-[15px] text-tinta outline-none focus:border-cobalto focus:ring-2 focus:ring-cobalto/20'

export const claseSelect =
  'rounded-xl border border-linea bg-white px-3 py-2 text-sm text-tinta outline-none focus:border-cobalto focus:ring-2 focus:ring-cobalto/20'

export function Boton({
  children,
  variante = 'primario',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: 'primario' | 'secundario' | 'fantasma' | 'peligro' }) {
  const v = {
    primario: 'bg-cobalto text-white hover:bg-cobalto-700 disabled:bg-cobalto/40',
    secundario: 'bg-white text-cobalto border border-cobalto-100 hover:bg-cobalto-50',
    fantasma: 'text-gris hover:bg-niebla',
    peligro: 'bg-white text-alerta border border-alerta/30 hover:bg-alerta-50',
  }[variante]
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed ${v} ${className}`}
    >
      {children}
    </button>
  )
}
