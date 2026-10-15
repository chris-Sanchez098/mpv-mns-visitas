import { ArrowLeft, Camera, Clock, MapPin, MapPinPlus, Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet'
import { FotoVisita } from '../../components/FotoVisita'
import { FormNovedad, ListaNovedades } from '../../components/Novedades'
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
  const sesion = useDemo((s) => s.usuarios.find((x) => x.id === s.sesion))
  const visitas = useDemo((s) => s.visitas)
  const [agregando, setAgregando] = useState(false)

  if (!v || !p || !u) return <p className="text-gris">No encontramos esta visita. Vuelve al seguimiento y elige otra.</p>

  // Posición registrada: desplazada desde el punto según la distancia guardada
  const d = v.distanciaM ?? 0
  const lat = p.lat ?? 3.43
  const lng = p.lng ?? -76.52
  const registrada: [number, number] = [lat + (d / 111_000) * 0.6, lng + (d / 111_000) * 0.8]
  // Vendedoras: la foto del día está en la primera visita de su jornada
  const fotoJornada = v.vendedora && !v.foto && !v.fotoSemilla ? visitas.find((x) => x.usuarioId === v.usuarioId && x.fecha === v.fecha && (x.foto || x.fotoSemilla)) : undefined
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
            {u.nombre}, {PERFIL_NOMBRE[u.perfil].toLowerCase()} · {p.codigo} · {p.direccion || 'Sin dirección registrada'} · {p.zona} · {capitalizar(fechaLarga(v.fecha))}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!v.programada && <span className="rounded-full bg-cobalto-50 px-2.5 py-1 text-sm font-medium text-cobalto">No programada</span>}
          <EstadoChip estado={v.estado} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          {v.estado === 'realizada' && v.impulsadora ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <figure>
                <FotoVisita visita={v} punto={p} className="aspect-[4/3] w-full" />
                <figcaption className="mt-1.5 text-sm text-gris">Llegada al almacén ({v.llegada})</figcaption>
              </figure>
              <figure>
                <FotoVisita visita={v} punto={p} tipo="exhibicion" className="aspect-[4/3] w-full" />
                <figcaption className="mt-1.5 text-sm text-gris">Exhibición al cierre del día ({v.salida})</figcaption>
              </figure>
            </div>
          ) : v.estado === 'realizada' && (v.foto || v.fotoSemilla) ? (
            <figure>
              <FotoVisita visita={v} punto={p} className="aspect-[4/3] w-full" />
              <figcaption className="mt-1.5 text-sm text-gris">Foto de inicio de jornada de {u.nombre}</figcaption>
            </figure>
          ) : v.estado === 'realizada' ? (
            <div className="flex items-start gap-3 rounded-xl border border-dashed border-linea bg-white p-5 text-sm text-gris">
              <Camera size={18} className="mt-0.5 shrink-0" aria-hidden />
              <span>
                Las vendedoras toman una sola foto al inicio de la jornada.{' '}
                {fotoJornada ? (
                  <Link to={`/panel/visita/${fotoJornada.id}`} className="font-medium text-cobalto hover:underline">
                    Ver la foto de este día ({fotoJornada.llegada})
                  </Link>
                ) : (
                  'Este día no tiene foto registrada.'
                )}
              </span>
            </div>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-linea bg-white p-8 text-center text-gris">
              {v.estado === 'no_realizada' && `No se realizó: ${v.motivoNoRealizacion}`}
              {v.estado === 'reprogramada' && `Reprogramada${v.reprogramadaPara ? ` para el ${fechaLarga(v.reprogramadaPara)}` : ''}`}
              {v.estado === 'programada' && (v.llegada ? `En jornada desde las ${v.llegada}. El cierre del día aún no se ha registrado.` : 'La visita aún no se ha registrado en campo.')}
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
                {v.ubicacionTomada ? <MapPinPlus size={15} className="text-cobalto" aria-hidden /> : <MapPin size={15} className="text-gris" aria-hidden />}
                {v.ubicacionTomada ? (
                  <span>
                    El cliente no tenía dirección ni ubicación. Esta visita registró su ubicación (<span className="tabular">{lat.toFixed(5)}, {lng.toFixed(5)}</span>), que queda como referencia del punto.
                  </span>
                ) : v.enRango ? (
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
                <MapContainer center={[lat, lng]} zoom={d > 400 ? 14 : 17} scrollWheelZoom={false} className="h-full w-full">
                  <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Circle center={[lat, lng]} radius={RANGO_M} pathOptions={{ color: '#1546a0', weight: 1, fillOpacity: 0.08 }} />
                  <CircleMarker center={[lat, lng]} radius={6} pathOptions={{ color: '#fff', weight: 2, fillColor: '#1546a0', fillOpacity: 1 }}>
                    <Tooltip permanent direction="top">Punto de venta</Tooltip>
                  </CircleMarker>
                  {!v.ubicacionTomada && <CircleMarker center={registrada} radius={6} pathOptions={{ color: '#fff', weight: 2, fillColor: v.enRango ? '#2f8a43' : '#c0392b', fillOpacity: 1 }}>
                    <Tooltip permanent direction="bottom">Registro</Tooltip>
                  </CircleMarker>}
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
                <Dato etiqueta="Gestión realizada" valor={v.vendedora.gestion === 'Otros' ? `Otros: ${v.vendedora.gestionOtro ?? ''}` : v.vendedora.gestion} ancho={v.vendedora.gestion === 'Otros'} />
                <Dato etiqueta="Estado de cartera" valor={v.vendedora.estadoCartera} alerta={v.vendedora.estadoCartera === 'Vencida'} />
                <Dato etiqueta="Estimado de pedido" valor={v.vendedora.estimadoPedido ? pesos(v.vendedora.estimadoPedido) : 'Sin pedido'} />
                <Dato etiqueta="Unidades del pedido" valor={`${v.vendedora.unidadesPedido}`} />
                {v.vendedora.motivoNoVenta && <Dato etiqueta="Motivo de no venta" valor={v.vendedora.motivoNoVenta} ancho />}
                <Faltantes lista={v.vendedora.faltantes} />
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
                <Faltantes lista={v.impulsadora.faltantes} />
                <Dato etiqueta="Material POP" valor={v.impulsadora.pop ? 'Instalado' : 'No hay'} />
                {v.impulsadora.popObservaciones && <Dato etiqueta="Observaciones POP" valor={v.impulsadora.popObservaciones} ancho />}
                <Dato etiqueta="Promociones" valor={v.impulsadora.promociones} />
                <Dato etiqueta="Actividades" valor={v.impulsadora.actividades.join(', ')} ancho />
                <Dato etiqueta="Competencia observada" valor={v.impulsadora.competencia} ancho />
                <Dato etiqueta="Oportunidades" valor={v.impulsadora.oportunidades} ancho />
                <Dato etiqueta="Novedades" valor={v.impulsadora.novedades} ancho />
              </dl>
            </Tarjeta>
          )}

          {v.estado === 'realizada' && (
            <Tarjeta
              titulo="Novedades después del cierre"
              accion={
                !agregando && (
                  <button onClick={() => setAgregando(true)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-cobalto hover:bg-cobalto-50">
                    <Plus size={15} aria-hidden /> Agregar novedad
                  </button>
                )
              }
            >
              {agregando ? <FormNovedad visitaId={v.id} autor={sesion?.nombre ?? 'Panel'} onListo={() => setAgregando(false)} /> : <ListaNovedades novedades={v.novedadesPosteriores} />}
              {!agregando && v.novedadesPosteriores.length > 0 && <p className="mt-3 text-xs text-gris">El registro original de la visita se conserva sin cambios.</p>}
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

function Tarjeta({ titulo, children, accion }: { titulo: string; children: ReactNode; accion?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-linea bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-semibold">{titulo}</h2>
        {accion}
      </div>
      {children}
    </section>
  )
}

function Faltantes({ lista }: { lista: { producto: string; cantidad: number }[] }) {
  return (
    <div className="col-span-2">
      <dt className="text-xs text-gris">Faltantes de producto</dt>
      <dd className="mt-1">
        {lista.length === 0 ? (
          <span className="text-[15px] font-medium">Ninguno</span>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {lista.map((f) => (
              <li key={f.producto} className="rounded-lg bg-alerta-50 px-2.5 py-1 text-sm text-alerta">
                {f.producto} <strong className="tabular">{f.cantidad} und.</strong>
              </li>
            ))}
          </ul>
        )}
      </dd>
    </div>
  )
}

function Dato({ etiqueta, valor, icono, ancho, alerta }: { etiqueta: string; valor?: string; icono?: ReactNode; ancho?: boolean; alerta?: boolean }) {
  return (
    <div className={ancho ? 'col-span-2' : ''}>
      <dt className="text-xs text-gris">{etiqueta}</dt>
      <dd className={`mt-0.5 flex items-center gap-1.5 text-[15px] font-medium tabular ${alerta ? 'text-alerta' : ''}`}>
        {icono}
        {valor ?? '—'}
      </dd>
    </div>
  )
}
