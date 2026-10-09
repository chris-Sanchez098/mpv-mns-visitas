import { CloudOff, LayoutDashboard, RefreshCw, Wifi } from 'lucide-react'
import { Outlet, useNavigate } from 'react-router-dom'
import { BarraDemo } from '../../components/BarraDemo'
import { Logo } from '../../components/Marca'
import { DEMO } from '../../data/mock'
import { PERFIL_NOMBRE } from '../../data/types'
import { useDemo } from '../../store'

export function CampoLayout() {
  const usuario = useDemo((s) => s.usuarios.find((u) => u.id === s.sesion))
  const nav = useNavigate()
  const iniciar = useDemo((s) => s.iniciar)

  return (
    <div className="flex min-h-screen flex-col">
      <BarraDemo />
      <div className="flex flex-1 items-stretch justify-center gap-12 md:items-center md:py-8">
        {/* En computador se muestra dentro de un marco de teléfono; en el dispositivo móvil ocupa toda la pantalla */}
        <div className="flex w-full flex-col bg-niebla md:h-[820px] md:w-[400px] md:overflow-hidden md:rounded-[44px] md:border-[10px] md:border-tinta md:shadow-2xl">
          <EncabezadoApp nombre={usuario?.nombre ?? ''} perfil={usuario ? PERFIL_NOMBRE[usuario.perfil] : ''} />
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </div>

        <aside className="hidden max-w-xs lg:block">
          <h2 className="text-xl font-bold">Así lo ve el personal en campo</h2>
          <p className="mt-2 leading-relaxed text-gris">
            Funciona desde el navegador de cualquier dispositivo móvil, sin instalar nada. Registra una visita y luego abre el panel: el indicador se actualiza al instante.
          </p>
          <p className="mt-3 leading-relaxed text-gris">Prueba también el modo sin conexión con el interruptor de la parte superior.</p>
          <button
            onClick={() => {
              iniciar(DEMO.direccion)
              nav('/panel/seguimiento')
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-tinta px-4 py-2.5 text-sm font-semibold text-white hover:bg-cobalto"
          >
            <LayoutDashboard size={16} aria-hidden /> Ver el panel de Dirección Comercial
          </button>
          <p className="mt-6 text-sm text-gris">
            Cambiar de perfil de campo:{' '}
            <button className="font-medium text-cobalto underline-offset-2 hover:underline" onClick={() => { iniciar(DEMO.impulsadora); nav('/campo') }}>
              impulsadora
            </button>{' '}
            o{' '}
            <button className="font-medium text-cobalto underline-offset-2 hover:underline" onClick={() => { iniciar(DEMO.vendedora); nav('/campo') }}>
              vendedora
            </button>
          </p>
        </aside>
      </div>
    </div>
  )
}

function EncabezadoApp({ nombre, perfil }: { nombre: string; perfil: string }) {
  const enLinea = useDemo((s) => s.enLinea)
  const sincronizando = useDemo((s) => s.sincronizando)
  const pendientes = useDemo((s) => s.visitas.filter((v) => v.sync === 'pendiente').length)
  const cambiar = useDemo((s) => s.cambiarConexion)

  return (
    <header className="bg-cobalto px-4 pt-4 pb-3 text-white">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Logo size={30} claro />
          <div className="min-w-0 leading-tight">
            <div className="truncate font-semibold">{nombre}</div>
            <div className="text-xs text-white/70">{perfil}</div>
          </div>
        </div>
        <button
          onClick={() => cambiar(!enLinea)}
          role="switch"
          aria-checked={enLinea}
          aria-label="Conexión a internet"
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${enLinea ? 'bg-white/15' : 'bg-[#f5c56b] text-tinta'}`}
        >
          {enLinea ? <Wifi size={14} aria-hidden /> : <CloudOff size={14} aria-hidden />}
          {enLinea ? 'En línea' : 'Sin conexión'}
        </button>
      </div>
      {(pendientes > 0 || sincronizando) && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs">
          {sincronizando ? (
            <>
              <RefreshCw size={14} className="animate-spin" aria-hidden /> Sincronizando {pendientes} {pendientes === 1 ? 'visita' : 'visitas'}…
            </>
          ) : (
            <>
              <CloudOff size={14} aria-hidden /> {pendientes} {pendientes === 1 ? 'visita guardada' : 'visitas guardadas'} en el dispositivo. Se enviarán al recuperar la señal.
            </>
          )}
        </div>
      )}
    </header>
  )
}
