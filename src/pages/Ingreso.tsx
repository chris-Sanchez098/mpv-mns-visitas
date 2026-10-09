import { ClipboardList, LayoutDashboard, Settings2, ShoppingBag, Store } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BarraDemo } from '../components/BarraDemo'
import { Logo } from '../components/Marca'
import { DEMO } from '../data/mock'
import { PERFIL_NOMBRE, type Perfil } from '../data/types'
import { useDemo } from '../store'

const OPCIONES: { perfil: Perfil; id: string; Icono: typeof Store; donde: string; que: string; destino: string }[] = [
  { perfil: 'impulsadora', id: DEMO.impulsadora, Icono: Store, donde: 'Dispositivo móvil', que: 'Ruta del día, registro con foto y ubicación, ejecución en punto', destino: '/campo' },
  { perfil: 'vendedora', id: DEMO.vendedora, Icono: ShoppingBag, donde: 'Dispositivo móvil', que: 'Ruta del día, pedidos, recaudo y compromisos', destino: '/campo' },
  { perfil: 'supervision', id: DEMO.supervision, Icono: ClipboardList, donde: 'Panel web', que: 'Crear y publicar el plan, seguir la ejecución', destino: '/panel/planificacion' },
  { perfil: 'direccion', id: DEMO.direccion, Icono: LayoutDashboard, donde: 'Panel web', que: 'Indicadores, desviaciones y evidencia de cada visita', destino: '/panel/seguimiento' },
  { perfil: 'administracion', id: DEMO.administracion, Icono: Settings2, donde: 'Panel web', que: 'Usuarios, puntos de venta y listas configurables', destino: '/panel/administracion' },
]

export function Ingreso() {
  const usuarios = useDemo((s) => s.usuarios)
  const iniciar = useDemo((s) => s.iniciar)
  const nav = useNavigate()

  return (
    <div className="flex min-h-screen flex-col">
      <BarraDemo />
      <div className="grid flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <section className="relative flex flex-col justify-between overflow-hidden bg-cobalto px-6 py-10 text-white sm:px-12 lg:py-14">
          <div className="flex items-center gap-3">
            <Logo size={40} claro />
            <span className="text-lg font-bold">Ruta Millenium</span>
          </div>
          <div className="relative z-10 my-12 max-w-md">
            <h1 className="text-[2.6rem] leading-[1.05] font-extrabold tracking-tight sm:text-5xl">
              Lo que se planea, se visita. Lo que se visita, se mide.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-white/80">
              Las personas en campo registran, el sistema organiza y evidencia, el dashboard mide y la Dirección Comercial decide.
            </p>
          </div>
          <p className="relative z-10 text-sm text-white/60">18 impulsadoras y 3 vendedoras comerciales en el Valle del Cauca</p>
          {/* Tapa del "tarrito azul" como motivo gráfico */}
          <div aria-hidden className="absolute -right-24 -bottom-28 h-80 w-80 rounded-[64px] bg-cobalto-700" />
          <div aria-hidden className="absolute -right-10 bottom-40 h-24 w-56 rounded-3xl bg-tinta/60" />
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-xl">
            <h2 className="text-2xl font-bold">Ingresar a la demo</h2>
            <p className="mt-1.5 text-gris">Elige un perfil para recorrer la herramienta como lo haría cada persona de la compañía.</p>
            <ul className="mt-7 space-y-2.5">
              {OPCIONES.map((o) => {
                const u = usuarios.find((x) => x.id === o.id)
                return (
                  <li key={o.perfil}>
                    <button
                      onClick={() => {
                        iniciar(o.id)
                        nav(o.destino)
                      }}
                      className="group flex w-full items-center gap-4 rounded-2xl border border-linea bg-white p-4 text-left transition-colors hover:border-cobalto"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cobalto-50 text-cobalto group-hover:bg-cobalto group-hover:text-white">
                        <o.Icono size={21} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline gap-x-2">
                          <span className="font-semibold">{PERFIL_NOMBRE[o.perfil]}</span>
                          <span className="text-sm text-gris">{u?.nombre}</span>
                        </span>
                        <span className="block text-sm text-gris">{o.que}</span>
                      </span>
                      <span className="hidden shrink-0 rounded-full bg-niebla px-2.5 py-1 text-xs font-medium text-gris sm:block">{o.donde}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
