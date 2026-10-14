import { ArrowLeft, ChevronRight, MessageSquarePlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EstadoChip } from '../../components/ui'
import { capitalizar, fechaLarga, hoyDemo } from '../../lib/fechas'
import { useDemo } from '../../store'

/** Visitas cerradas de días anteriores, para registrar novedades posteriores (devoluciones, cambios de pedido). */
export function VisitasAnteriores() {
  const sesion = useDemo((s) => s.sesion)
  const visitas = useDemo((s) => s.visitas)
  const puntos = useDemo((s) => s.puntos)
  const hoy = hoyDemo()
  const mias = visitas
    .filter((v) => v.usuarioId === sesion && v.fecha < hoy && v.estado === 'realizada')
    .sort((a, b) => `${b.fecha}${b.llegada}`.localeCompare(`${a.fecha}${a.llegada}`))
  const porDia = [...new Set(mias.map((v) => v.fecha))]

  return (
    <div className="p-4">
      <Link to="/campo" className="inline-flex items-center gap-1 text-sm font-medium text-gris">
        <ArrowLeft size={16} aria-hidden /> Ruta de hoy
      </Link>
      <h1 className="mt-1 text-xl font-bold">Visitas anteriores</h1>
      <p className="mt-1 text-sm text-gris">Abre una visita cerrada para agregar una novedad, como una devolución o un cambio en el pedido. El registro original no se modifica.</p>
      {porDia.map((d) => (
        <section key={d} className="mt-5">
          <h2 className="mb-2 text-sm font-semibold text-gris">{capitalizar(fechaLarga(d))}</h2>
          <ul className="space-y-2">
            {mias
              .filter((v) => v.fecha === d)
              .map((v) => (
                <li key={v.id}>
                  <Link to={`/campo/visita/${v.id}`} className="flex items-center gap-3 rounded-2xl bg-white p-3.5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{puntos.find((p) => p.id === v.puntoId)?.nombre}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gris tabular">
                        <EstadoChip estado={v.estado} pequeño />
                        {v.llegada}–{v.salida}
                        {v.novedadesPosteriores.length > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-ambar-50 px-2 py-0.5 font-medium text-ambar">
                            <MessageSquarePlus size={12} aria-hidden /> {v.novedadesPosteriores.length} novedad
                          </span>
                        )}
                      </span>
                    </span>
                    <ChevronRight size={18} className="shrink-0 text-gris" aria-hidden />
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
