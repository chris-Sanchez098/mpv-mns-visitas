import type { Punto, Visita } from '../data/types'

type TipoFoto = 'presencia' | 'exhibicion'

function semillero(semilla: number) {
  let s = semilla
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

/**
 * Foto de la visita.
 * - presencia: foto de llegada (impulsadora) o de inicio de jornada (vendedora).
 * - exhibicion: foto de la góndola con los productos de Natural Systems (impulsadora).
 * Si se tomó en la demo se muestra la foto real; si viene de los datos de ejemplo, una ilustración.
 */
export function FotoVisita({
  visita,
  punto,
  tipo = 'presencia',
  className = '',
  compacta = false,
}: {
  visita: Visita
  punto?: Punto
  tipo?: TipoFoto
  className?: string
  compacta?: boolean
}) {
  const coords = punto?.lat !== undefined && punto.lng !== undefined ? ` · ${punto.lat.toFixed(4)}, ${punto.lng.toFixed(4)}` : ''
  const sello = `${visita.fecha} ${visita.llegada ?? ''}${coords}`
  const real = tipo === 'presencia' ? visita.foto : visita.fotoExhibicion
  const semilla = tipo === 'presencia' ? visita.fotoSemilla : visita.fotoExhibicionSemilla

  if (real) {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-tinta ${className}`}>
        <img src={real} alt={`Foto tomada en ${punto?.nombre ?? 'el punto de venta'}`} className="h-full w-full object-cover" />
        {!compacta && <span className="absolute bottom-2 left-2 rounded-md bg-black/55 px-2 py-1 text-[11px] text-white tabular">{sello}</span>}
      </div>
    )
  }
  if (semilla === undefined) return null

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      {tipo === 'presencia' ? <Fachada semilla={semilla} nombre={punto?.nombre ?? ''} /> : <Gondola semilla={semilla} nombre={punto?.nombre ?? ''} />}
      {!compacta && <span className="absolute top-2 right-2 rounded-md bg-white/85 px-2 py-0.5 text-[11px] font-medium text-gris">Foto de demostración</span>}
      {!compacta && <span className="absolute bottom-2 left-2 rounded-md bg-black/55 px-2 py-1 text-[11px] text-white tabular">{sello}</span>}
    </div>
  )
}

function Fachada({ semilla, nombre }: { semilla: number; nombre: string }) {
  const r = semillero(semilla)
  const muro = ['#efe6d6', '#e4ecf2', '#f1e3dc', '#e6efe3'][Math.floor(r() * 4)]
  const toldo = ['#2f8a43', '#c0392b', '#1546a0', '#d9822b'][Math.floor(r() * 4)]
  const rotulo = nombre.length > 26 ? nombre.slice(0, 25) + '…' : nombre
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label={`Foto de demostración de la fachada de ${nombre}`} preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="300" fill="#bcd3e6" />
      <rect x="0" y="40" width="400" height="230" fill={muro} />
      <rect x="40" y="56" width="320" height="34" rx="4" fill="#0e2a55" />
      <text x="200" y="79" textAnchor="middle" fontSize="17" fontWeight="700" fill="#fff" fontFamily="Onest, system-ui, sans-serif">
        {rotulo}
      </text>
      <path d={`M30 96 H370 L350 124 H50 Z`} fill={toldo} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={i} x={50 + i * 40} y="96" width="20" height="28" fill="#fff" opacity="0.35" />
      ))}
      <rect x="60" y="136" width="170" height="120" fill="#dfe9f2" stroke="#9aa9b8" strokeWidth="3" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={76 + i * 50} y="196" width="28" height="44" rx="5" fill="#1546a0" />
          <rect x={76 + i * 50} y="189" width="28" height="9" rx="3" fill="#0e2a55" />
          <rect x={79 + i * 50} y="208" width="22" height="14" rx="2" fill="#fff" />
        </g>
      ))}
      <rect x="250" y="136" width="90" height="134" fill="#6b5847" />
      <rect x="258" y="144" width="74" height="70" fill="#dfe9f2" opacity="0.7" />
      <circle cx="326" cy="210" r="4" fill="#e0b84c" />
      <rect x="0" y="270" width="400" height="30" fill="#a7a39b" />
    </svg>
  )
}

function Gondola({ semilla, nombre }: { semilla: number; nombre: string }) {
  const r = semillero(semilla)
  const pared = ['#e9e4da', '#dfe7ee', '#ece6e0', '#e2e8e0'][Math.floor(r() * 4)]
  const ajenos = ['#d9822b', '#c9c2b4', '#8aa66c', '#b85c5c', '#e0b84c']
  const estantes = [70, 140, 210]
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label={`Foto de demostración de la exhibición en ${nombre}`} preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="300" fill={pared} />
      <rect x="20" y="10" width="360" height="290" fill="#f7f5f1" stroke="#cfc8bb" />
      {estantes.map((y, fi) => {
        const items: React.ReactNode[] = []
        let x = 30
        let k = 0
        while (x < 360) {
          const propio = r() < 0.55
          const w = propio ? 26 : 22 + r() * 10
          const h = propio ? 44 : 30 + r() * 22
          const vacio = r() < 0.06
          if (!vacio) {
            items.push(
              propio ? (
                <g key={k}>
                  <rect x={x} y={y + 52 - h} width={w} height={h} rx="5" fill="#1546a0" />
                  <rect x={x} y={y + 52 - h - 7} width={w} height="9" rx="3" fill="#0e2a55" />
                  <rect x={x + 3} y={y + 52 - h + 12} width={w - 6} height="16" rx="2" fill="#fff" />
                  <rect x={x + 6} y={y + 52 - h + 17} width={w - 12} height="3" fill="#2f8a43" />
                </g>
              ) : (
                <rect key={k} x={x} y={y + 52 - h} width={w} height={h} rx="3" fill={ajenos[Math.floor(r() * ajenos.length)]} opacity="0.85" />
              ),
            )
          }
          x += w + 4
          k++
        }
        return (
          <g key={fi}>
            {items}
            <rect x="22" y={y + 52} width="356" height="8" fill="#a9a091" />
            <rect x="40" y={y + 54} width="34" height="5" fill="#fff" opacity="0.8" />
          </g>
        )
      })}
    </svg>
  )
}
