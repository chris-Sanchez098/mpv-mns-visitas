export function Logo({ size = 32, claro = false }: { size?: number; claro?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect x="14" y="6" width="36" height="12" rx="4" fill={claro ? '#D3E0F5' : '#0E2A55'} />
      <rect x="10" y="16" width="44" height="44" rx="10" fill={claro ? '#FFFFFF' : '#1546A0'} />
      <path d="M24 44c0-9 6-15 16-16-1 10-7 16-16 16z" fill={claro ? '#2F8A43' : '#7CC68B'} />
    </svg>
  )
}

export function Marca() {
  return (
    <div className="flex items-center gap-2.5">
      <Logo />
      <div className="leading-tight">
        <div className="text-[15px] font-bold text-tinta">Ruta Millenium</div>
        <div className="hidden text-xs text-gris sm:block">Planificación y seguimiento de visitas</div>
      </div>
    </div>
  )
}
