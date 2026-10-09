import { ArrowLeft, Clock, MapPin } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet'
import { FotoVisita } from '../../components/FotoVisita'
import { EstadoChip, FueraDeRango } from '../../components/ui'
import { PERFIL_NOMBRE } from '../../data/types'
import { capitalizar, fechaLarga, pesos } from '../../lib/fechas'
import { useDemo } from '../../store'

const RANGO_M = 150

function minutos(a?: string, b?: string) {
  if (!a || !b) return null
  const m = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5))
  return m(b) - m(a)
}

export function DetalleVisita() {
  const { id } = useParams()
  const nav = useNavigate()
  const v = useDemo((s) => s.visitas.find((x) => x.id === id))
  const p = useDemo((s) => s.puntos.find((x) => x.id === v?.puntoId))
  const u = useDemo((s) => s.usuarios.find((x) => x.id === v?.usuarioId))

  if (!v || !p || !u) return <p className="text-gris">No encontramos esta visita. Vuelve al seguimiento y elige otra.</p>

  // Posición registrada: desplazada desde el punto según la distancia guardada
  const d = v.distanciaM ?? 0
  const registrada: [number, number] = [p.lat + (d / 111_000) * 0.6, p.lng + (d / 111_000) * 0.8]
  const dur = minutos(v.llegada, v.salida)

  return (
    <div className="space-y-5">
      <button onClick={() => nav(-1)} className="inline-flex items-center gap-1.5 text-sm font-medium text-gris hover:text-cobalto">
        <ArrowLeft size={16} aria-hidden /> Volver
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{p.nombre}</h1>
          <p className="mt-1 text-gris">
            {u.nombre}, {PERFIL_NOMBRE[u.perfil].toLowerCase()} · {p.zona} · {capitalizar(fechaLarga(v.fecha))}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!v.programada && <span className="rounded-full bg-cobalto-50 px-2.5 py-1 text-sm font-medium text-cobalto">No programada</span>}
          <EstadoChip estado={v.estado} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          {v.estado === 'realizada' ? (
            <FotoVisita visita={v} punto={p} className="aspect-[4/3] w-full" />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-linea bg-white p-8 text-center text-gris">
              {v.estado === 'no_realizada' && `No se realizó: ${v.motivoNoRealizacion}`}
              {v.estado === 'reprogramada' && `Reprogramada${v.reprogramadaPara ? ` para el ${fechaLarga(v.reprogramadaPara)}` : ''}`}
              {v.estado === 'programada' && 'La visita aún no se ha registrado en campo.'}
            </div>
          )}

          {v.estado === 'realizada' && (
            <Tarjeta titulo="Evidencia de presencia">
              <dl className="grid grid-cols-3 gap-4">
                <Dato etiqueta="Llegada" valor={v.llegada} icono={<Clock size={15} />} />
                <Dato etiqueta="Salida" valor={v.salida} icono={<Clock size={15} />} />
                <Dato etiqueta="Duración" valor={dur !== null ? `${dur} min` : '—'} />
              </dl>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <MapPin size={15} className="text-gris" aria-hidden />
                {v.enRango ? (
                  <span>
                    Registrada a <strong className="tabular">{d} m</strong> del punto, dentro del rango de {RANGO_M} m.
                  </span>
                ) : (
                  <>
                    <FueraDeRango distancia={d} />
                    <span className="text-gris">El rango permitido es de {RANGO_M} m.</span>
                  </>
                )}
              </div>
              <div className="mt-4 h-56 overflow-hidden rounded-xl">
                <MapContainer center={[p.lat, p.lng]} zoom={d > 400 ? 14 : 17} scrollWheelZoom={false} className="h-full w-full">
                  <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Circle center={[p.lat, p.lng]} radius={RANGO_M} pathOptions={{ color: '#1546a0', weight: 1, fillOpacity: 0.08 }} />
                  <CircleMarker center={[p.lat, p.lng]} radius={6} pathOptions={{ color: '#fff', weight: 2, fillColor: '#1546a0', fillOpacity: 1 }}>
                    <Tooltip permanent direction="top">Punto de venta</Tooltip>
                  </CircleMarker>
                  <CircleMarker center={registrada} radius={6} pathOptions={{ color: '#fff', weight: 2, fillColor: v.enRango ? '#2f8a43' : '#c0392b', fillOpacity: 1 }}>
                    <Tooltip permanent direction="bottom">Registro</Tooltip>
                  </CircleMarker>
                </MapContainer>
              </div>
            </Tarjeta>
          )}
        </div>

        <div className="space-y-5">
          <Tarjeta titulo={v.programada ? 'Lo planificado' : 'Por qué se hizo'}>
            {v.programada ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Dato etiqueta="Orden en la ruta" valor={`${v.orden}`} />
                <Dato etiqueta="Franja" valor={v.franja} />
                <Dato etiqueta="Tipo de visita" valor={v.tipo} />
                <Dato etiqueta="Objetivo" valor={v.objetivo} />
                <Dato etiqueta="Impacto esperado" valor={v.impacto} ancho />
              </dl>
            ) : (
              <p className="text-sm">{v.motivoNoProgramada}</p>
            )}
          </Tarjeta>

          {v.vendedora && (
            <Tarjeta titulo="Gestión comercial">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Dato etiqueta="Gestión realizada" valor={v.vendedora.gestion} />
                <Dato etiqueta="Valor del pedido" valor={v.vendedora.valorPedido ? pesos(v.vendedora.valorPedido) : 'Sin pedido'} />
                <Dato etiqueta="Recaudo" valor={v.vendedora.recaudo ? pesos(v.vendedora.recaudo) : 'Sin recaudo'} />
                {v.vendedora.motivoNoVenta && <Dato etiqueta="Motivo de no venta" valor={v.vendedora.motivoNoVenta} />}
                <Dato etiqueta="Seguimiento a compromisos" valor={v.vendedora.seguimiento} ancho />
                <Dato etiqueta="Novedades" valor={v.vendedora.novedades} ancho />
                <Dato
                  etiqueta="Próxima acción"
                  valor={`${v.vendedora.proximaAccion}${v.vendedora.fechaCompromiso ? ` (${fechaLarga(v.vendedora.fechaCompromiso)})` : ''}`}
                  ancho
                />
              </dl>
            </Tarjeta>
          )}

          {v.impulsadora && (
            <Tarjeta titulo="Ejecución en punto">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Dato etiqueta="Unidades vendidas" valor={`${v.impulsadora.unidades}`} />
                <Dato etiqueta="Exhibición" valor={v.impulsadora.exhibicion} />
                <Dato etiqueta="Productos agotados" valor={v.impulsadora.agotados.length ? v.impulsadora.agotados.join(', ') : 'Ninguno'} ancho />
                <Dato etiqueta="Material POP" valor={v.impulsadora.pop ? 'Instalado' : 'No hay'} />
                <Dato etiqueta="Promociones" valor={v.impulsadora.promociones} />
                <Dato etiqueta="Actividades" valor={v.impulsadora.actividades.join(', ')} ancho />
                <Dato etiqueta="Competencia observada" valor={v.impulsadora.competencia} ancho />
                <Dato etiqueta="Oportunidades" valor={v.impulsadora.oportunidades} ancho />
                <Dato etiqueta="Novedades" valor={v.impulsadora.novedades} ancho />
              </dl>
            </Tarjeta>
          )}

          <Tarjeta titulo="Historial">
            <ol className="space-y-2 border-l-2 border-linea pl-4 text-sm">
              {v.historial.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ol>
          </Tarjeta>
        </div>
      </div>
    </div>
  )
}

function Tarjeta({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-linea bg-white p-5">
      <h2 className="mb-4 font-semibold">{titulo}</h2>
      {children}
    </section>
  )
}

function Dato({ etiqueta, valor, icono, ancho }: { etiqueta: string; valor?: string; icono?: ReactNode; ancho?: boolean }) {
  return (
    <div className={ancho ? 'col-span-2' : ''}>
      <dt className="text-xs text-gris">{etiqueta}</dt>
      <dd className="mt-0.5 flex items-center gap-1.5 text-[15px] font-medium tabular">
        {icono}
        {valor ?? '—'}
      </dd>
    </div>
  )
}
