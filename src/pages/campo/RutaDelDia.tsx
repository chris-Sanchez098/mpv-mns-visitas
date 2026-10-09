import { ChevronRight, CloudOff, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EstadoChip } from '../../components/ui'
import { capitalizar, fechaLarga, hoyDemo } from '../../lib/fechas'
import { useDemo } from '../../store'

export function RutaDelDia() {
  const sesion = useDemo((s) => s.sesion)
  const visitas = useDemo((s) => s.visitas)
  const puntos = useDemo((s) => s.puntos)
  const hoy = hoyDemo()
  const deHoy = visitas.filter((v) => v.usuarioId === sesion && v.fecha === hoy)
  const ruta = deHoy.filter((v) => v.programada).sort((a, b) => a.orden - b.orden)
  const extra = deHoy.filter((v) => !v.programada)
  const hechas = ruta.filter((v) => v.estado !== 'programada').length
  const siguiente = ruta.find((v) => v.estado === 'programada')
  const punto = (id: string) => puntos.find((p) => p.id === id)

  return (
    <div className="p-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold">Ruta de hoy</h1>
        <span className="text-sm text-gris">{capitalizar(fechaLarga(hoy))}</span>
      </div>
      <div className="mt-3 rounded-2xl bg-white p-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">
            {hechas} de {ruta.length} visitas
          </span>
          <span className="text-gris">{ruta.length - hechas} pendientes</span>
        </div>
        <div className="mt-2 flex gap-1" aria-hidden>
          {ruta.map((v) => (
            <span
              key={v.id}
              className={`h-2 flex-1 rounded-full ${v.estado === 'realizada' ? 'bg-hoja' : v.estado === 'programada' ? 'bg-cobalto-100' : v.estado === 'no_realizada' ? 'bg-alerta' : 'bg-ambar'}`}
            />
          ))}
        </div>
      </div>

      <ol className="mt-4 space-y-2.5">
        {ruta.map((v) => {
          const p = punto(v.puntoId)
          const esSiguiente = v.id === siguiente?.id
          return (
            <li key={v.id}>
              <Link
                to={`/campo/visita/${v.id}`}
                className={`flex items-center gap-3 rounded-2xl bg-white p-3.5 ${esSiguiente ? 'ring-2 ring-cobalto' : ''} ${v.estado !== 'programada' ? 'opacity-75' : ''}`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${esSiguiente ? 'bg-cobalto text-white' : 'bg-cobalto-50 text-cobalto'}`}>
                  {v.orden}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{p?.nombre}</span>
                  <span className="block truncate text-xs text-gris">
                    {v.franja} · {v.objetivo}
                  </span>
                  <span className="mt-1.5 flex items-center gap-1.5">
                    <EstadoChip estado={v.estado} pequeño />
                    {v.sync === 'pendiente' && (
                      <span className="inline-flex items-center gap-1 text-xs text-ambar">
                        <CloudOff size={12} aria-hidden /> Por sincronizar
                      </span>
                    )}
                  </span>
                </span>
                <ChevronRight size={18} className="shrink-0 text-gris" aria-hidden />
              </Link>
            </li>
          )
        })}
      </ol>

      {extra.length > 0 && (
        <>
          <h2 className="mt-6 mb-2 text-sm font-semibold text-gris">No programadas</h2>
          <ul className="space-y-2">
            {extra.map((v) => (
              <li key={v.id}>
                <Link to={`/campo/visita/${v.id}`} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-cobalto-100 bg-white p-3.5">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{punto(v.puntoId)?.nombre}</span>
                    <span className="block truncate text-xs text-gris">{v.motivoNoProgramada}</span>
                  </span>
                  <EstadoChip estado={v.estado} pequeño />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <Link to="/campo/no-programada" className="mt-5 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cobalto-100 p-3.5 font-semibold text-cobalto hover:bg-white">
        <Plus size={18} aria-hidden /> Registrar visita no programada
      </Link>
    </div>
  )
}
