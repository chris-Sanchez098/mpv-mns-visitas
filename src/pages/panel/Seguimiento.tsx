import { AlertTriangle, CalendarX2, Download, MapPinOff, PackageX, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CircleMarker, MapContainer, TileLayer, Tooltip as MapTip } from 'react-leaflet'
import { claseSelect, FueraDeRango } from '../../components/ui'
import { FotoVisita } from '../../components/FotoVisita'
import { ESTADO_NOMBRE, PERFIL_NOMBRE, type Estado, type Visita } from '../../data/types'
import { capitalizar, diasHabiles, fechaCorta, fechaLarga, hoyDemo, pesos, pesosCortos } from '../../lib/fechas'
import { filtrar, indicadores, META_CUMPLIMIENTO, porc, type Filtros } from '../../lib/metricas'
import { exportarVisitas } from '../../lib/excel'
import { useDemo } from '../../store'

const COLOR_ESTADO: Record<Estado, string> = {
  realizada: '#2f8a43',
  programada: '#b9c9e6',
  no_realizada: '#c0392b',
  reprogramada: '#d9a21b',
}

export function Seguimiento() {
  const { usuarios, puntos, visitas, sincronizando } = useDemo()
  const hoy = hoyDemo()
  const [periodo, setPeriodo] = useState<'hoy' | 'semana'>('hoy')
  const [zona, setZona] = useState('')
  const [perfil, setPerfil] = useState<Filtros['perfil']>('')
  const [usuarioId, setUsuarioId] = useState('')
  const nav = useNavigate()

  const dias = useMemo(() => (periodo === 'hoy' ? [hoy] : diasHabiles(hoy, 6)), [periodo, hoy])
  const zonaDe = useMemo(() => new Map(puntos.map((p) => [p.id, p.zona])), [puntos])
  const puntoDe = useMemo(() => new Map(puntos.map((p) => [p.id, p])), [puntos])
  const usuarioDe = useMemo(() => new Map(usuarios.map((u) => [u.id, u])), [usuarios])
  const campo = usuarios.filter((u) => u.perfil === 'impulsadora' || u.perfil === 'vendedora')

  const vs = useMemo(() => filtrar(visitas, usuarios, zonaDe, { dias, zona, perfil, usuarioId }), [visitas, usuarios, zonaDe, dias, zona, perfil, usuarioId])
  const k = indicadores(vs)
  const pendientesSync = visitas.filter((v) => v.sync === 'pendiente').length

  // Ruta por persona, de menor a mayor cumplimiento: las desviaciones quedan arriba
  const porPersona = useMemo(() => {
    const m = new Map<string, Visita[]>()
    vs.forEach((v) => m.set(v.usuarioId, [...(m.get(v.usuarioId) ?? []), v]))
    return [...m.entries()]
      .map(([id, lista]) => ({ u: usuarioDe.get(id)!, lista: lista.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.orden - b.orden), k: indicadores(lista) }))
      .sort((a, b) => a.k.cumplimiento - b.k.cumplimiento || a.u.nombre.localeCompare(b.u.nombre))
  }, [vs, usuarioDe])

  const porZona = useMemo(
    () =>
      useDemo
        .getState()
        .listas.zonas.map((z) => ({ zona: z, k: indicadores(vs.filter((v) => zonaDe.get(v.puntoId) === z)) }))
        .filter((x) => x.k.programadas > 0)
        .map((x) => ({ zona: x.zona, cumplimiento: Math.round(x.k.cumplimiento * 100), realizadas: x.k.realizadas, programadas: x.k.programadas })),
    [vs, zonaDe],
  )

  const bajos = porPersona.filter((p) => p.k.programadas - p.k.porVisitar > 0 && p.k.cumplimiento < META_CUMPLIMIENTO)
  const fuera = vs.filter((v) => v.enRango === false)
  const conAgotados = vs.filter((v) => (v.impulsadora?.agotados.length ?? 0) > 0)
  const compromisos = useMemo(
    () =>
      visitas
        .filter((v) => v.vendedora?.proximaAccion && v.vendedora.fechaCompromiso && !v.vendedora.compromisoCumplido && v.sync === 'sincronizada')
        .filter((v) => !usuarioId || v.usuarioId === usuarioId)
        .filter((v) => !zona || zonaDe.get(v.puntoId) === zona)
        .sort((a, b) => a.vendedora!.fechaCompromiso!.localeCompare(b.vendedora!.fechaCompromiso!)),
    [visitas, usuarioId, zona, zonaDe],
  )
  const vencidos = compromisos.filter((v) => v.vendedora!.fechaCompromiso! < hoy)

  const ultimoEstadoPorPunto = useMemo(() => {
    const m = new Map<string, Visita>()
    vs.forEach((v) => {
      const prev = m.get(v.puntoId)
      if (!prev || `${v.fecha}${v.llegada ?? ''}` > `${prev.fecha}${prev.llegada ?? ''}`) m.set(v.puntoId, v)
    })
    return [...m.values()]
  }, [vs])

  const recientes = useMemo(
    () => vs.filter((v) => v.estado === 'realizada').sort((a, b) => `${b.fecha}${b.salida}`.localeCompare(`${a.fecha}${a.salida}`)).slice(0, 8),
    [vs],
  )

  const metaOk = k.cumplimiento >= META_CUMPLIMIENTO
  const verPerfil = (p: 'vendedora' | 'impulsadora') => !perfil || perfil === p

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Seguimiento de la fuerza de ventas</h1>
          <p className="mt-1 text-gris">
            {periodo === 'hoy' ? capitalizar(fechaLarga(hoy)) : `Del ${fechaLarga(dias[0])} al ${fechaLarga(hoy)}`}
            {sincronizando && (
              <span className="ml-3 inline-flex items-center gap-1 text-cobalto">
                <RefreshCw size={14} className="animate-spin" aria-hidden /> Recibiendo visitas de campo…
              </span>
            )}
            {!sincronizando && pendientesSync > 0 && (
              <span className="ml-3 text-ambar">{pendientesSync} visitas en campo esperan señal para sincronizar</span>
            )}
          </p>
        </div>
        <button
          onClick={() => exportarVisitas(vs, usuarios, puntos, `visitas-${periodo === 'hoy' ? hoy : `${dias[0]}-a-${hoy}`}`)}
          className="inline-flex items-center gap-2 rounded-xl border border-linea bg-white px-4 py-2.5 text-sm font-semibold text-tinta hover:bg-niebla"
        >
          <Download size={16} aria-hidden /> Exportar a Excel
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 rounded-2xl border border-linea bg-white p-3">
        <div className="flex rounded-xl bg-niebla p-1" role="group" aria-label="Periodo">
          {(['hoy', 'semana'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              aria-pressed={periodo === p}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold ${periodo === p ? 'bg-white text-cobalto shadow-sm' : 'text-gris'}`}
            >
              {p === 'hoy' ? 'Hoy' : 'Últimos 6 días'}
            </button>
          ))}
        </div>
        <select aria-label="Zona" className={claseSelect} value={zona} onChange={(e) => setZona(e.target.value)}>
          <option value="">Todas las zonas</option>
          {useDemo.getState().listas.zonas.map((z) => (
            <option key={z}>{z}</option>
          ))}
        </select>
        <select aria-label="Perfil" className={claseSelect} value={perfil} onChange={(e) => { setPerfil(e.target.value as Filtros['perfil']); setUsuarioId('') }}>
          <option value="">Impulsadoras y vendedoras</option>
          <option value="impulsadora">Solo impulsadoras</option>
          <option value="vendedora">Solo vendedoras</option>
        </select>
        <select aria-label="Persona" className={claseSelect} value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
          <option value="">Todas las personas</option>
          {campo
            .filter((u) => !perfil || u.perfil === perfil)
            .map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
        </select>
      </div>

      {/* Planificado frente a ejecutado */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)]">
        <div className={`rounded-2xl p-6 text-white ${metaOk ? 'bg-cobalto' : 'bg-tinta'}`}>
          <div className="text-sm text-white/75">Cumplimiento de ruta</div>
          <div className="mt-1 flex items-end gap-3">
            <span className="text-6xl font-extrabold tracking-tight tabular">{porc(k.cumplimiento)}</span>
            <span className={`mb-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${metaOk ? 'bg-white/15' : 'bg-[#f5c56b] text-tinta'}`}>
              {!metaOk && <AlertTriangle size={13} aria-hidden />}
              Meta {porc(META_CUMPLIMIENTO)}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            {k.realizadas} de {k.programadas - k.porVisitar} visitas programadas ya vencidas se realizaron.
            {k.porVisitar > 0 && ` Quedan ${k.porVisitar} por visitar hoy.`}
          </p>
          <div className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-white/15" aria-hidden>
            <div style={{ width: `${(k.realizadas / Math.max(1, k.programadas)) * 100}%` }} className="bg-[#7cc68b]" />
            <div style={{ width: `${(k.noRealizadas / Math.max(1, k.programadas)) * 100}%` }} className="bg-[#f08a7e]" />
            <div style={{ width: `${(k.reprogramadas / Math.max(1, k.programadas)) * 100}%` }} className="bg-[#f5c56b]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-linea bg-linea sm:grid-cols-3 xl:grid-cols-6">
          {[
            { t: 'Programadas', v: k.programadas, d: 'en el plan publicado' },
            { t: 'Realizadas', v: k.realizadas, d: 'con foto y ubicación', c: 'text-hoja' },
            { t: 'No realizadas', v: k.noRealizadas, d: 'con motivo registrado', c: 'text-alerta' },
            { t: 'Reprogramadas', v: k.reprogramadas, d: 'movidas a otra fecha', c: 'text-ambar' },
            { t: 'Por visitar', v: k.porVisitar, d: 'aún en la ruta de hoy' },
            { t: 'Gestión adicional', v: k.adicionales, d: 'visitas no programadas', c: 'text-cobalto' },
          ].map((x) => (
            <div key={x.t} className="bg-white p-4">
              <div className="text-sm text-gris">{x.t}</div>
              <div className={`mt-1 text-3xl font-bold tabular ${x.c ?? ''}`}>{x.v}</div>
              <div className="mt-0.5 text-xs text-gris">{x.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Resultados por perfil */}
      <section className="grid gap-4 md:grid-cols-2">
        {verPerfil('vendedora') && (
          <div className="rounded-2xl border border-linea bg-white p-5">
            <h2 className="font-semibold">Resultado de las vendedoras</h2>
            <dl className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <dt className="text-sm text-gris">Pedidos</dt>
                <dd className="mt-1 text-2xl font-bold tabular">{pesosCortos(k.pedidos)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gris">Recaudo</dt>
                <dd className="mt-1 text-2xl font-bold tabular">{pesosCortos(k.recaudo)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gris">Visitas con venta</dt>
                <dd className="mt-1 text-2xl font-bold tabular">{porc(k.efectividadVenta)}</dd>
              </div>
            </dl>
          </div>
        )}
        {verPerfil('impulsadora') && (
          <div className="rounded-2xl border border-linea bg-white p-5">
            <h2 className="font-semibold">Ejecución de las impulsadoras</h2>
            <dl className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <dt className="text-sm text-gris">Unidades vendidas</dt>
                <dd className="mt-1 text-2xl font-bold tabular">{k.unidades.toLocaleString('es-CO')}</dd>
              </div>
              <div>
                <dt className="text-sm text-gris">Agotados reportados</dt>
                <dd className="mt-1 text-2xl font-bold tabular">{k.agotados}</dd>
              </div>
              <div>
                <dt className="text-sm text-gris">Exhibición deficiente</dt>
                <dd className="mt-1 text-2xl font-bold tabular">{k.exhibicionDeficiente}</dd>
              </div>
            </dl>
          </div>
        )}
      </section>

      {/* Ruta por persona + desviaciones */}
      <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-linea bg-white p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold">Ruta de cada persona</h2>
            <p className="text-sm text-gris">De menor a mayor cumplimiento. Cada cápsula es una visita.</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gris">
            {(Object.keys(COLOR_ESTADO) as Estado[]).map((e) => (
              <span key={e} className="flex items-center gap-1.5">
                <span className="inline-block h-3.5 w-2 rounded-full" style={{ background: COLOR_ESTADO[e] }} />
                {ESTADO_NOMBRE[e]}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3.5 w-2 rounded-full border-2 border-cobalto bg-white" />
              No programada
            </span>
          </div>
          <ul className="mt-4 max-h-[520px] divide-y divide-linea overflow-y-auto pr-1">
            {porPersona.map(({ u, lista, k: kp }) => {
              const bajo = kp.programadas - kp.porVisitar > 0 && kp.cumplimiento < META_CUMPLIMIENTO
              return (
                <li key={u.id} className="flex items-center gap-3 py-2.5">
                  <div className="w-40 shrink-0 sm:w-48">
                    <div className="truncate text-sm font-medium">{u.nombre}</div>
                    <div className="truncate text-xs text-gris">
                      {PERFIL_NOMBRE[u.perfil]} · {u.zonas.join(', ')}
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-wrap gap-1">
                    {lista.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => nav(`/panel/visita/${v.id}`)}
                        title={`${fechaCorta(v.fecha)} · ${puntoDe.get(v.puntoId)?.nombre} · ${v.programada ? ESTADO_NOMBRE[v.estado] : 'No programada'}${v.enRango === false ? ' · fuera de rango' : ''}`}
                        aria-label={`${puntoDe.get(v.puntoId)?.nombre}, ${ESTADO_NOMBRE[v.estado]}`}
                        className={`h-6 w-3 rounded-full transition-transform hover:scale-125 ${v.enRango === false ? 'ring-2 ring-alerta ring-offset-1' : ''}`}
                        style={v.programada ? { background: COLOR_ESTADO[v.estado] } : { background: '#fff', border: '2.5px solid #1546a0' }}
                      />
                    ))}
                  </div>
                  <div className={`flex w-16 shrink-0 items-center justify-end gap-1 text-sm font-semibold tabular ${bajo ? 'text-alerta' : ''}`}>
                    {bajo && <AlertTriangle size={14} aria-label="Por debajo de la meta" />}
                    {kp.programadas - kp.porVisitar > 0 ? porc(kp.cumplimiento) : '—'}
                  </div>
                </li>
              )
            })}
            {porPersona.length === 0 && <li className="py-8 text-center text-gris">No hay visitas con estos filtros. Prueba con otro periodo o zona.</li>}
          </ul>
        </div>

        <div className="rounded-2xl border border-linea bg-white p-5">
          <h2 className="font-semibold">Desviaciones para revisar</h2>
          <ul className="mt-4 space-y-3">
            <Desviacion Icono={AlertTriangle} n={bajos.length} titulo="Personas bajo la meta de cumplimiento" detalle={bajos.slice(0, 3).map((b) => `${b.u.nombre} (${porc(b.k.cumplimiento)})`).join(', ')} />
            <Desviacion Icono={MapPinOff} n={fuera.length} titulo="Visitas registradas fuera del rango del punto" detalle={fuera.slice(0, 2).map((v) => `${usuarioDe.get(v.usuarioId)?.nombre} en ${puntoDe.get(v.puntoId)?.nombre}`).join(', ')} enlace={fuera[0] && `/panel/visita/${fuera[0].id}`} />
            <Desviacion Icono={CalendarX2} n={vencidos.length} titulo="Compromisos de vendedoras vencidos" detalle={vencidos.slice(0, 2).map((v) => `${v.vendedora!.proximaAccion} · ${puntoDe.get(v.puntoId)?.nombre}`).join(', ')} />
            <Desviacion Icono={PackageX} n={conAgotados.length} titulo="Puntos con productos agotados" detalle={[...new Set(conAgotados.flatMap((v) => v.impulsadora!.agotados))].slice(0, 4).join(', ')} />
          </ul>
        </div>
      </section>

      {/* Mapa + zonas */}
      <section className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="rounded-2xl border border-linea bg-white p-5">
          <h2 className="font-semibold">Puntos visitados en el periodo</h2>
          <p className="mt-0.5 text-sm text-gris">Color según el último estado de la visita en cada punto.</p>
          <div className="mt-4 h-[360px] overflow-hidden rounded-xl">
            <MapContainer center={[3.43, -76.47]} zoom={10} scrollWheelZoom={false} className="h-full w-full">
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {ultimoEstadoPorPunto.map((v) => {
                const p = puntoDe.get(v.puntoId)!
                return (
                  <CircleMarker
                    key={v.puntoId}
                    center={[p.lat, p.lng]}
                    radius={7}
                    pathOptions={{ color: '#fff', weight: 2, fillColor: COLOR_ESTADO[v.estado], fillOpacity: 1 }}
                    eventHandlers={{ click: () => nav(`/panel/visita/${v.id}`) }}
                  >
                    <MapTip>
                      <strong>{p.nombre}</strong>
                      <br />
                      {usuarioDe.get(v.usuarioId)?.nombre} · {ESTADO_NOMBRE[v.estado]}
                    </MapTip>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-linea bg-white p-5">
          <h2 className="font-semibold">Cumplimiento por zona</h2>
          <p className="mt-0.5 text-sm text-gris">La línea marca la meta del {porc(META_CUMPLIMIENTO)}.</p>
          <div className="mt-4 h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porZona} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }} barCategoryGap={10}>
                <CartesianGrid horizontal={false} stroke="#e6ecf4" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(x) => `${x} %`} tick={{ fill: '#5d6b82', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="zona" width={84} tick={{ fill: '#0e2a55', fontSize: 13 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#eef3f9' }}
                  formatter={(v, _n, item) => [`${v} % (${item.payload.realizadas} de ${item.payload.programadas})`, 'Cumplimiento']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #d9e2ee', fontFamily: 'Onest' }}
                />
                <ReferenceLine x={Math.round(META_CUMPLIMIENTO * 100)} stroke="#0e2a55" strokeDasharray="4 4" />
                <Bar isAnimationActive={false} dataKey="cumplimiento" fill="#1546a0" radius={[0, 4, 4, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Evidencia y compromisos */}
      <section className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="rounded-2xl border border-linea bg-white p-5">
          <h2 className="font-semibold">Últimas visitas registradas</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {recientes.map((v) => {
              const p = puntoDe.get(v.puntoId)
              return (
                <li key={v.id}>
                  <Link to={`/panel/visita/${v.id}`} className="flex gap-3 rounded-xl border border-linea p-2.5 hover:border-cobalto">
                    <FotoVisita visita={v} punto={p} compacta className="h-20 w-24 shrink-0" />
                    <div className="min-w-0 text-sm">
                      <div className="truncate font-semibold">{p?.nombre}</div>
                      <div className="truncate text-gris">{usuarioDe.get(v.usuarioId)?.nombre}</div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-gris tabular">
                        {v.llegada}–{v.salida}
                        {!v.programada && <span className="rounded-full bg-cobalto-50 px-2 py-0.5 font-medium text-cobalto">No programada</span>}
                        {v.enRango === false && <FueraDeRango />}
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-linea bg-white p-5">
          <h2 className="font-semibold">Compromisos y próximas acciones</h2>
          <ul className="mt-3 divide-y divide-linea">
            {compromisos.slice(0, 7).map((v) => {
              const vencido = v.vendedora!.fechaCompromiso! < hoy
              return (
                <li key={v.id}>
                  <Link to={`/panel/visita/${v.id}`} className="flex items-start justify-between gap-3 py-2.5 hover:text-cobalto">
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{v.vendedora!.proximaAccion}</span>
                      <span className="block truncate text-xs text-gris">
                        {puntoDe.get(v.puntoId)?.nombre} · {usuarioDe.get(v.usuarioId)?.nombre}
                      </span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${vencido ? 'bg-alerta-50 text-alerta' : 'bg-niebla text-gris'}`}>
                      {vencido ? 'Venció ' : ''}
                      {fechaCorta(v.vendedora!.fechaCompromiso!)}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
          <p className="mt-3 text-xs text-gris">
            {compromisos.length} compromisos abiertos · {vencidos.length} vencidos · Pedidos de la semana: {pesos(indicadores(filtrar(visitas, usuarios, zonaDe, { dias: diasHabiles(hoy, 6), zona, perfil: 'vendedora', usuarioId })).pedidos)}
          </p>
        </div>
      </section>
    </div>
  )
}

function Desviacion({ Icono, n, titulo, detalle, enlace }: { Icono: typeof AlertTriangle; n: number; titulo: string; detalle: string; enlace?: string }) {
  const contenido = (
    <div className={`flex gap-3 rounded-xl p-3 ${n > 0 ? 'bg-alerta-50/60' : 'bg-niebla'}`}>
      <Icono size={18} className={`mt-0.5 shrink-0 ${n > 0 ? 'text-alerta' : 'text-gris'}`} aria-hidden />
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className={`text-xl font-bold tabular ${n > 0 ? 'text-alerta' : 'text-gris'}`}>{n}</span>
          <span className="text-sm font-medium">{titulo}</span>
        </div>
        {n > 0 && detalle && <p className="mt-0.5 line-clamp-2 text-xs text-gris">{detalle}</p>}
      </div>
    </div>
  )
  return <li>{enlace ? <Link to={enlace}>{contenido}</Link> : contenido}</li>
}
