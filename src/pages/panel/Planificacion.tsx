import { CalendarClock, CheckCircle2, Copy, Plus, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Boton, Campo, claseInput, claseSelect, EstadoChip, Modal } from '../../components/ui'
import { PERFIL_NOMBRE, type Visita } from '../../data/types'
import { capitalizar, diasHabiles, fechaCorta, fechaLarga, hoyDemo, siguienteHabil } from '../../lib/fechas'
import { useDemo } from '../../store'

export function Planificacion() {
  const { usuarios, puntos, visitas, listas, planPublicado, publicarPlan, agregarVisitaPlan, avisar } = useDemo()
  const hoy = hoyDemo()
  const manana = siguienteHabil(hoy)
  const dias = [...diasHabiles(hoy, 6).slice(3), manana, siguienteHabil(manana)]
  const [fecha, setFecha] = useState(hoy)
  const [usuarioId, setUsuarioId] = useState('')
  const [agregando, setAgregando] = useState(false)
  const [reprogramando, setReprogramando] = useState<Visita | null>(null)

  const campo = usuarios.filter((u) => u.perfil === 'impulsadora' || u.perfil === 'vendedora')
  const puntoDe = useMemo(() => new Map(puntos.map((p) => [p.id, p])), [puntos])
  const delDia = visitas.filter((v) => v.fecha === fecha && v.programada && (!usuarioId || v.usuarioId === usuarioId))
  const grupos = campo
    .filter((u) => !usuarioId || u.id === usuarioId)
    .map((u) => ({ u, lista: delDia.filter((v) => v.usuarioId === u.id).sort((a, b) => a.orden - b.orden) }))
    .filter((g) => g.lista.length > 0 || usuarioId)

  const publicado = planPublicado[fecha] ?? fecha <= hoy
  const esFuturo = fecha > hoy
  const personasConPlan = new Set(visitas.filter((v) => v.fecha === fecha && v.programada).map((v) => v.usuarioId)).size

  const copiarDeHoy = () => {
    visitas
      .filter((v) => v.fecha === hoy && v.programada)
      .forEach((v) =>
        agregarVisitaPlan({
          usuarioId: v.usuarioId,
          puntoId: v.puntoId,
          fecha,
          orden: v.orden,
          franja: v.franja,
          tipo: v.tipo,
          objetivo: v.objetivo,
          impacto: v.impacto,
        }),
      )
    avisar('Plan copiado. Revísalo y publícalo cuando esté listo')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Planificación de visitas</h1>
          <p className="mt-1 text-gris">El plan publicado es la base contra la que se mide el cumplimiento.</p>
        </div>
        <Boton onClick={() => setAgregando(true)}>
          <Plus size={18} aria-hidden /> Agregar visita al plan
        </Boton>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-linea bg-white p-1.5" role="tablist" aria-label="Día del plan">
          {dias.map((d) => (
            <button
              key={d}
              role="tab"
              aria-selected={d === fecha}
              onClick={() => setFecha(d)}
              className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold ${d === fecha ? 'bg-cobalto text-white' : 'text-gris hover:bg-niebla'}`}
            >
              {d === hoy ? 'Hoy' : d === manana ? 'Mañana' : capitalizar(fechaCorta(d))}
            </button>
          ))}
        </div>
        <select aria-label="Persona" className={claseSelect} value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
          <option value="">Toda la fuerza de ventas</option>
          {campo.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre} · {PERFIL_NOMBRE[u.perfil]}
            </option>
          ))}
        </select>
      </div>

      {/* Estado del plan del día */}
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 ${publicado ? 'bg-hoja-50' : 'bg-ambar-50'}`}>
        <div className="flex items-center gap-3">
          {publicado ? <CheckCircle2 className="text-hoja" aria-hidden /> : <CalendarClock className="text-ambar" aria-hidden />}
          <div>
            <div className="font-semibold">
              {capitalizar(fechaLarga(fecha))}: {publicado ? 'plan publicado' : personasConPlan ? 'borrador sin publicar' : 'sin plan todavía'}
            </div>
            <div className="text-sm text-gris">
              {personasConPlan} personas con ruta asignada{publicado && !esFuturo ? ', ya visible en sus dispositivos' : ''}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {esFuturo && personasConPlan === 0 && (
            <Boton variante="secundario" onClick={copiarDeHoy}>
              <Copy size={16} aria-hidden /> Copiar el plan de hoy
            </Boton>
          )}
          {!publicado && personasConPlan > 0 && (
            <Boton
              onClick={() => {
                publicarPlan(fecha)
                avisar(`Plan publicado: ${personasConPlan} personas ya ven su ruta`)
              }}
            >
              <Send size={16} aria-hidden /> Publicar plan
            </Boton>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {grupos.map(({ u, lista }) => (
          <section key={u.id} className="overflow-hidden rounded-2xl border border-linea bg-white">
            <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-linea px-5 py-3">
              <div>
                <span className="font-semibold">{u.nombre}</span>
                <span className="ml-2 text-sm text-gris">
                  {PERFIL_NOMBRE[u.perfil]} · {u.zonas.join(', ')}
                </span>
              </div>
              <span className="text-sm text-gris">{lista.length} visitas</span>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="text-left text-xs text-gris">
                  <tr>
                    <th className="px-5 py-2 font-medium">Orden</th>
                    <th className="py-2 font-medium">Punto de venta</th>
                    <th className="py-2 font-medium">Franja</th>
                    <th className="py-2 font-medium">Tipo</th>
                    <th className="py-2 font-medium">Objetivo</th>
                    <th className="py-2 font-medium">Impacto esperado</th>
                    <th className="py-2 font-medium">Estado</th>
                    <th className="px-5 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-linea">
                  {lista.map((v) => (
                    <tr key={v.id}>
                      <td className="px-5 py-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cobalto-50 text-xs font-bold text-cobalto">{v.orden}</span>
                      </td>
                      <td className="py-2.5">
                        <div className="font-medium">{puntoDe.get(v.puntoId)?.nombre}</div>
                        <div className="text-xs text-gris">{puntoDe.get(v.puntoId)?.zona}</div>
                      </td>
                      <td className="py-2.5 whitespace-nowrap tabular">{v.franja}</td>
                      <td className="py-2.5">{v.tipo}</td>
                      <td className="py-2.5">{v.objetivo}</td>
                      <td className="py-2.5 text-gris">{v.impacto}</td>
                      <td className="py-2.5">
                        <EstadoChip estado={v.estado} pequeño />
                      </td>
                      <td className="px-5 py-2.5 text-right whitespace-nowrap">
                        {(v.estado === 'programada' || v.estado === 'no_realizada') && (
                          <button onClick={() => setReprogramando(v)} className="rounded-lg px-2 py-1 text-sm font-medium text-cobalto hover:bg-cobalto-50">
                            Reprogramar
                          </button>
                        )}
                        {v.estado !== 'programada' && (
                          <Link to={`/panel/visita/${v.id}`} className="rounded-lg px-2 py-1 text-sm font-medium text-gris hover:bg-niebla">
                            Ver
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                  {lista.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-6 text-center text-gris">
                        Sin visitas para este día. Usa “Agregar visita al plan”.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ))}
        {grupos.length === 0 && (
          <div className="rounded-2xl border border-dashed border-linea bg-white p-10 text-center text-gris">
            Aún no hay visitas planificadas para este día. Copia el plan de hoy o agrega visitas una por una.
          </div>
        )}
      </div>

      {agregando && <ModalAgregar fecha={fecha} usuarioInicial={usuarioId} onCerrar={() => setAgregando(false)} listas={listas} />}
      {reprogramando && <ModalReprogramar visita={reprogramando} onCerrar={() => setReprogramando(null)} />}
    </div>
  )
}

function ModalAgregar({ fecha, usuarioInicial, onCerrar, listas }: { fecha: string; usuarioInicial: string; onCerrar: () => void; listas: ReturnType<typeof useDemo.getState>['listas'] }) {
  const { usuarios, puntos, visitas, agregarVisitaPlan, avisar } = useDemo()
  const campo = usuarios.filter((u) => u.perfil === 'impulsadora' || u.perfil === 'vendedora')
  const [usuarioId, setUsuarioId] = useState(usuarioInicial || campo[0].id)
  const u = usuarios.find((x) => x.id === usuarioId)!
  const susPuntos = puntos.filter((p) => u.zonas.includes(p.zona))
  const [puntoId, setPuntoId] = useState(susPuntos[0]?.id ?? '')
  const [f, setF] = useState(fecha)
  const [franja, setFranja] = useState(listas.franjas[0])
  const [tipo, setTipo] = useState(u.perfil === 'vendedora' ? 'Toma de pedido' : 'Impulso y asesoría')
  const [objetivo, setObjetivo] = useState(listas.objetivos[0])
  const [impacto, setImpacto] = useState('')

  return (
    <Modal titulo="Agregar visita al plan" onCerrar={onCerrar}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          const orden = visitas.filter((v) => v.usuarioId === usuarioId && v.fecha === f && v.programada).length + 1
          agregarVisitaPlan({ usuarioId, puntoId: puntoId || susPuntos[0].id, fecha: f, orden, franja, tipo, objetivo, impacto: impacto || '—' })
          avisar('Visita agregada al plan. Publica el plan para que la vea en su ruta')
          onCerrar()
        }}
      >
        <Campo etiqueta="Persona">
          <select className={claseInput} value={usuarioId} onChange={(e) => { setUsuarioId(e.target.value); setPuntoId('') }}>
            {campo.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nombre} · {PERFIL_NOMBRE[x.perfil]}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Punto de venta" ayuda={`Puntos de ${u.zonas.join(' y ')}`}>
          <select className={claseInput} value={puntoId} onChange={(e) => setPuntoId(e.target.value)}>
            {susPuntos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Fecha">
            <input type="date" className={claseInput} value={f} onChange={(e) => setF(e.target.value)} />
          </Campo>
          <Campo etiqueta="Franja horaria">
            <select className={claseInput} value={franja} onChange={(e) => setFranja(e.target.value)}>
              {listas.franjas.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Campo>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Tipo de visita">
            <select className={claseInput} value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {listas.tiposVisita.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Objetivo">
            <select className={claseInput} value={objetivo} onChange={(e) => setObjetivo(e.target.value)}>
              {listas.objetivos.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Campo>
        </div>
        <Campo etiqueta="Impacto esperado">
          <input className={claseInput} placeholder="Ej.: pedido estimado de $ 1.500.000" value={impacto} onChange={(e) => setImpacto(e.target.value)} />
        </Campo>
        <div className="flex justify-end gap-2 pt-2">
          <Boton type="button" variante="fantasma" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit">Agregar visita</Boton>
        </div>
      </form>
    </Modal>
  )
}

function ModalReprogramar({ visita, onCerrar }: { visita: Visita; onCerrar: () => void }) {
  const { reprogramar, avisar, puntos } = useDemo()
  const opciones = [siguienteHabil(visita.fecha < hoyDemo() ? hoyDemo() : visita.fecha)]
  opciones.push(siguienteHabil(opciones[0]), siguienteHabil(siguienteHabil(opciones[0])))
  const [nueva, setNueva] = useState(opciones[0])
  return (
    <Modal titulo="Reprogramar visita" onCerrar={onCerrar}>
      <p className="text-gris">
        {puntos.find((p) => p.id === visita.puntoId)?.nombre}, programada para el {fechaLarga(visita.fecha)}. La visita original queda como reprogramada y el cambio se guarda en su historial.
      </p>
      <fieldset className="mt-4 space-y-2">
        <legend className="mb-2 text-sm font-medium">Nueva fecha</legend>
        {opciones.map((o) => (
          <label key={o} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${nueva === o ? 'border-cobalto bg-cobalto-50' : 'border-linea'}`}>
            <input type="radio" name="fecha" checked={nueva === o} onChange={() => setNueva(o)} className="accent-cobalto" />
            {capitalizar(fechaLarga(o))}
          </label>
        ))}
      </fieldset>
      <div className="mt-5 flex justify-end gap-2">
        <Boton variante="fantasma" onClick={onCerrar}>
          Cancelar
        </Boton>
        <Boton
          onClick={() => {
            reprogramar(visita.id, nueva)
            avisar(`Visita reprogramada para el ${fechaLarga(nueva)}`)
            onCerrar()
          }}
        >
          Reprogramar
        </Boton>
      </div>
    </Modal>
  )
}
