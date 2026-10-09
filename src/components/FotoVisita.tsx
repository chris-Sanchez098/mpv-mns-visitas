import type { Punto, Visita } from '../data/types'

/**
 * Foto de la visita. Si se tomó en la demo, se muestra la foto real.
 * Si viene de los datos de ejemplo, se dibuja una góndola ilustrada con los "tarritos azules".
 */
export function FotoVisita({ visita, punto, className = '', compacta = false }: { visita: Visita; punto?: Punto; className?: string; compacta?: boolean }) {
  const sello = `${visita.fecha} ${visita.llegada ?? ''}${punto ? ` · ${punto.lat.toFixed(4)}, ${punto.lng.toFixed(4)}` : ''}`

  if (visita.foto) {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-tinta ${className}`}>
        <img src={visita.foto} alt={`Foto tomada en ${punto?.nombre ?? 'el punto de venta'}`} className="h-full w-full object-cover" />
        {!compacta && <span className="absolute bottom-2 left-2 rounded-md bg-black/55 px-2 py-1 text-[11px] text-white tabular">{sello}</span>}
      </div>
    )
  }

  let s = visita.fotoSemilla ?? 7
  const r = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  const pared = ['#e9e4da', '#dfe7ee', '#ece6e0', '#e2e8e0'][Math.floor(r() * 4)]
  const ajenos = ['#d9822b', '#c9c2b4', '#8aa66c', '#b85c5c', '#e0b84c']
  const estantes = [70, 140, 210]

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label={`Foto de demostración de la góndola en ${punto?.nombre ?? 'el punto'}`} preserveAspectRatio="xMidYMid slice">
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
      {!compacta && <span className="absolute top-2 right-2 rounded-md bg-white/85 px-2 py-0.5 text-[11px] font-medium text-gris">Foto de demostración</span>}
      {!compacta && <span className="absolute bottom-2 left-2 rounded-md bg-black/55 px-2 py-1 text-[11px] text-white tabular">{sello}</span>}
    </div>
  )
}
