import { CalendarRange, LayoutDashboard, Settings2, Smartphone } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BarraDemo } from '../../components/BarraDemo'
import { Marca } from '../../components/Marca'
import { DEMO } from '../../data/mock'
import { PERFIL_NOMBRE } from '../../data/types'
import { useDemo } from '../../store'

const NAV = [
  { a: 'seguimiento', texto: 'Seguimiento', Icono: LayoutDashboard },
  { a: 'planificacion', texto: 'Planificación', Icono: CalendarRange },
  { a: 'administracion', texto: 'Administración', Icono: Settings2 },
]

export function PanelLayout() {
  const usuario = useDemo((s) => s.usuarios.find((u) => u.id === s.sesion))
  const iniciar = useDemo((s) => s.iniciar)
  const nav = useNavigate()
  const iniciales = usuario?.nombre.split(' ').slice(0, 2).map((p) => p[0]).join('')

  return (
    <div className="flex min-h-screen flex-col">
      <BarraDemo />
      <header className="sticky top-0 z-[500] border-b border-linea bg-white">
        <div className="flex items-center gap-6 px-4 py-3 lg:px-8">
          <Marca />
          <nav className="ml-4 hidden gap-1 md:flex" aria-label="Secciones del panel">
            {NAV.map((n) => (
              <NavLink
                key={n.a}
                to={n.a}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-[15px] font-medium ${isActive ? 'bg-cobalto-50 text-cobalto' : 'text-gris hover:bg-niebla'}`
                }
              >
                <n.Icono size={17} aria-hidden />
                {n.texto}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => {
                iniciar(DEMO.impulsadora)
                nav('/campo')
              }}
              className="hidden items-center gap-1.5 rounded-lg border border-linea px-3 py-2 text-sm font-medium text-gris hover:bg-niebla lg:flex"
              title="Abrir la aplicación de campo como impulsadora"
            >
              <Smartphone size={16} aria-hidden /> Ver app de campo
            </button>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tinta text-sm font-semibold text-white">{iniciales}</span>
              <span className="hidden leading-tight sm:block">
                <span className="block text-sm font-semibold">{usuario?.nombre}</span>
                <span className="block text-xs text-gris">{usuario && PERFIL_NOMBRE[usuario.perfil]}</span>
              </span>
            </div>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden" aria-label="Secciones del panel">
          {NAV.map((n) => (
            <NavLink
              key={n.a}
              to={n.a}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-cobalto-50 text-cobalto' : 'text-gris'}`
              }
            >
              <n.Icono size={15} aria-hidden />
              {n.texto}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1 px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
