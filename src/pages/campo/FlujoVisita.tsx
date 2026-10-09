import { ArrowLeft, Check, CheckCircle2, CloudOff, Loader2, LogIn, LogOut, MapPin, Minus, Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Camara } from '../../components/Camara'
import { FotoVisita } from '../../components/FotoVisita'
import { Boton, Campo, claseInput, EstadoChip } from '../../components/ui'
import type { GestionImpulsadora, GestionVendedora, Visita } from '../../data/types'
import { fechaLarga, horaActual, hoyDemo, pesos, siguienteHabil } from '../../lib/fechas'
import { useDemo } from '../../store'

type Paso = 'llegada' | 'foto' | 'formulario' | 'listo'

const PASOS: { k: Exclude<Paso, 'listo'>; t: string }[] = [
  { k: 'llegada', t: 'Llegada' },
  { k: 'foto', t: 'Foto' },
  { k: 'formulario', t: 'Gestión' },
]

export function FlujoVisita() {
  const { id } = useParams()
  const nav = useNavigate()
  const v = useDemo((s) => s.visitas.find((x) => x.id === id))
  const p = useDemo((s) => s.puntos.find((x) => x.id === v?.puntoId))
  const perfil = useDemo((s) => s.usuarios.find((u) => u.id === s.sesion)?.perfil)
  const enLinea = useDemo((s) => s.enLinea)
  const { registrarLlegada, guardarFoto, finalizarVisita, marcarNoRealizada, listas } = useDemo()

  const inicial: Paso = !v || v.estado !== 'programada' ? 'listo' : !v.llegada ? 'llegada' : !v.foto && !v.fotoSemilla ? 'foto' : 'formulario'
  const [paso, setPaso] = useState<Paso>(inicial)
  const [ubicando, setUbicando] = useState(false)
  const [noRealizada, setNoRealizada] = useState(false)
  const [recienCerrada, setRecienCerrada] = useState(false)

  if (!v || !p) return <p className="p-4 text-gris">No encontramos esta visita.</p>

  const llegar = () => {
    setUbicando(true)
    setTimeout(() => {
      registrarLlegada(v.id, { hora: horaActual(), distanciaM: 12 + Math.floor(Math.random() * 48), enRango: true })
      setUbicando(false)
    }, 1600)
  }

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-10 bg-niebla px-4 pt-3 pb-2">
        <Link to="/campo" className="inline-flex items-center gap-1 text-sm font-medium text-gris">
          <ArrowLeft size={16} aria-hidden /> Ruta de hoy
        </Link>
        <h1 className="mt-1 text-lg leading-tight font-bold">{p.nombre}</h1>
        <p className="text-xs text-gris">
          {p.direccion} · {p.zona}
        </p>
        {paso !== 'listo' && (
          <ol className="mt-3 flex gap-1.5" aria-label="Pasos de la visita">
            {PASOS.map((x, i) => {
              const idx = PASOS.findIndex((y) => y.k === paso)
              const hecho = i < idx
              const actual = i === idx
              return (
                <li key={x.k} className="flex-1">
                  <div className={`h-1.5 rounded-full ${hecho ? 'bg-hoja' : actual ? 'bg-cobalto' : 'bg-cobalto-100'}`} />
                  <div className={`mt-1 text-[11px] font-medium ${actual ? 'text-cobalto' : 'text-gris'}`}>{x.t}</div>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      <div className="px-4">
        {paso === 'llegada' && !noRealizada && (
          <div className="space-y-3">
            <Bloque>
              <div className="text-xs text-gris">{v.programada ? `Visita ${v.orden} de la ruta · ${v.franja}` : 'Visita no programada'}</div>
              <div className="mt-1 font-semibold">{v.objetivo}</div>
              {v.impacto !== '—' && <div className="mt-0.5 text-sm text-gris">Impacto esperado: {v.impacto}</div>}
              <div className="mt-2 text-sm text-gris">Contacto: {p.contacto}</div>
            </Bloque>

            {!v.llegada ? (
              <>
                <Boton className="w-full py-4 text-base" onClick={llegar} disabled={ubicando}>
                  {ubicando ? (
                    <>
                      <Loader2 size={18} className="animate-spin" aria-hidden /> Obteniendo ubicación GPS…
                    </>
                  ) : (
                    <>
                      <LogIn size={18} aria-hidden /> Registrar llegada
                    </>
                  )}
                </Boton>
                {v.programada && (
                  <Boton variante="peligro" className="w-full" onClick={() => setNoRealizada(true)}>
                    No se pudo realizar la visita
                  </Boton>
                )}
              </>
            ) : (
              <>
                <Bloque>
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-hoja-50 text-hoja">
                      <MapPin size={20} aria-hidden />
                    </span>
                    <div>
                      <div className="font-semibold text-hoja">Dentro del rango del punto</div>
                      <div className="text-sm text-gris">
                        Llegada a las <strong className="text-tinta tabular">{v.llegada}</strong>, a {v.distanciaM} m de la ubicación registrada del punto.
                      </div>
                    </div>
                  </div>
                </Bloque>
                <Boton className="w-full py-3.5" onClick={() => setPaso('foto')}>
                  Continuar con la foto
                </Boton>
              </>
            )}
          </div>
        )}

        {paso === 'llegada' && noRealizada && (
          <NoRealizada
            motivos={listas.motivosNoRealizacion}
            onCancelar={() => setNoRealizada(false)}
            onConfirmar={(m) => {
              marcarNoRealizada(v.id, m)
              setRecienCerrada(true)
              setPaso('listo')
            }}
          />
        )}

        {paso === 'foto' && (
          <Camara
            onFoto={(f) => {
              guardarFoto(v.id, f)
              setPaso('formulario')
            }}
            onSinCamara={() => {
              useDemo.setState((s) => ({ visitas: s.visitas.map((x) => (x.id === v.id ? { ...x, fotoSemilla: 4242 } : x)) }))
              setPaso('formulario')
            }}
          />
        )}

        {paso === 'formulario' &&
          (perfil === 'vendedora' ? (
            <FormVendedora
              visita={v}
              listas={listas}
              onGuardar={(g) => {
                finalizarVisita(v.id, horaActual(), { vendedora: g })
                setRecienCerrada(true)
                setPaso('listo')
              }}
            />
          ) : (
            <FormImpulsadora
              listas={listas}
              onGuardar={(g) => {
                finalizarVisita(v.id, horaActual(), { impulsadora: g })
                setRecienCerrada(true)
                setPaso('listo')
              }}
            />
          ))}

        {paso === 'listo' && (
          <div className="space-y-3">
            {recienCerrada && (
              <div className="rounded-2xl bg-white p-5 text-center">
                <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${enLinea ? 'bg-hoja-50 text-hoja' : 'bg-ambar-50 text-ambar'}`}>
                  {enLinea ? <CheckCircle2 size={30} aria-hidden /> : <CloudOff size={28} aria-hidden />}
                </span>
                <p className="mt-3 text-lg font-bold">{v.estado === 'realizada' ? 'Visita registrada' : 'Registro guardado'}</p>
                <p className="mt-1 text-sm text-gris">
                  {enLinea
                    ? 'La Dirección Comercial ya la ve en el panel.'
                    : 'Quedó guardada en el dispositivo con su hora y ubicación. Se enviará sola cuando vuelva la señal.'}
                </p>
              </div>
            )}
            <Resumen visita={v} />
            <Boton className="w-full py-3.5" onClick={() => nav('/campo')}>
              Volver a la ruta
            </Boton>
          </div>
        )}
      </div>
    </div>
  )
}

function Bloque({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl bg-white p-4">{children}</div>
}

function NoRealizada({ motivos, onCancelar, onConfirmar }: { motivos: string[]; onCancelar: () => void; onConfirmar: (m: string) => void }) {
  const [m, setM] = useState('')
  return (
    <div className="space-y-3">
      <Bloque>
        <fieldset>
          <legend className="font-semibold">¿Por qué no se realizó?</legend>
          <div className="mt-3 space-y-2">
            {motivos.map((x) => (
              <label key={x} className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${m === x ? 'border-cobalto bg-cobalto-50' : 'border-linea'}`}>
                <input type="radio" name="motivo" checked={m === x} onChange={() => setM(x)} className="accent-cobalto" />
                {x}
              </label>
            ))}
          </div>
        </fieldset>
      </Bloque>
      <Boton className="w-full" disabled={!m} onClick={() => onConfirmar(m)}>
        Guardar motivo
      </Boton>
      <Boton variante="fantasma" className="w-full" onClick={onCancelar}>
        Cancelar
      </Boton>
    </div>
  )
}

function Chips({ opciones, valor, onCambio }: { opciones: string[]; valor: string[]; onCambio: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {opciones.map((o) => {
        const sel = valor.includes(o)
        return (
          <button
            type="button"
            key={o}
            aria-pressed={sel}
            onClick={() => onCambio(sel ? valor.filter((x) => x !== o) : [...valor, o])}
            className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm ${sel ? 'border-cobalto bg-cobalto text-white' : 'border-linea bg-white text-tinta'}`}
          >
            {sel && <Check size={13} aria-hidden />}
            {o}
          </button>
        )
      })}
    </div>
  )
}

function Segmentado<T extends string>({ opciones, valor, onCambio }: { opciones: readonly T[]; valor: T; onCambio: (v: T) => void }) {
  return (
    <div className="flex rounded-xl bg-niebla p-1">
      {opciones.map((o) => (
        <button
          type="button"
          key={o}
          aria-pressed={valor === o}
          onClick={() => onCambio(o)}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold ${valor === o ? 'bg-white text-cobalto shadow-sm' : 'text-gris'}`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

function BotonSalida({ onClick }: { onClick: () => void }) {
  return (
    <Boton type="submit" className="w-full py-4 text-base" onClick={onClick}>
      <LogOut size={18} aria-hidden /> Registrar salida y guardar
    </Boton>
  )
}

function FormImpulsadora({ listas, onGuardar }: { listas: ReturnType<typeof useDemo.getState>['listas']; onGuardar: (g: GestionImpulsadora) => void }) {
  const [g, setG] = useState<GestionImpulsadora>({
    asistencia: true,
    agotados: [],
    unidades: 12,
    exhibicion: 'Buena',
    pop: true,
    promociones: 'Lleve 2 Magnesio con 15 % de descuento',
    actividades: ['Asesoría a compradores'],
    competencia: '',
    oportunidades: '',
    novedades: '',
  })
  const set = <K extends keyof GestionImpulsadora>(k: K, val: GestionImpulsadora[K]) => setG({ ...g, [k]: val })
  return (
    <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
      <Bloque>
        <div className="space-y-4">
          <Campo etiqueta="Asistencia al punto">
            <Segmentado opciones={['Asistí', 'No asistí'] as const} valor={g.asistencia ? 'Asistí' : 'No asistí'} onCambio={(x) => set('asistencia', x === 'Asistí')} />
          </Campo>
          <div>
            <span className="mb-1.5 block text-sm font-medium">Unidades vendidas</span>
            <div className="flex items-center gap-3">
              <button type="button" aria-label="Restar" onClick={() => set('unidades', Math.max(0, g.unidades - 1))} className="flex h-11 w-11 items-center justify-center rounded-xl border border-linea bg-white">
                <Minus size={18} />
              </button>
              <input aria-label="Unidades vendidas" inputMode="numeric" className={`${claseInput} w-20 text-center text-lg font-bold tabular`} value={g.unidades} onChange={(e) => set('unidades', Number(e.target.value.replace(/\D/g, '')) || 0)} />
              <button type="button" aria-label="Sumar" onClick={() => set('unidades', g.unidades + 1)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-linea bg-white">
                <Plus size={18} />
              </button>
            </div>
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-medium">Productos agotados</span>
            <Chips opciones={listas.productos} valor={g.agotados} onCambio={(x) => set('agotados', x)} />
          </div>
        </div>
      </Bloque>
      <Bloque>
        <div className="space-y-4">
          <Campo etiqueta="Exhibición">
            <Segmentado opciones={['Buena', 'Regular', 'Deficiente'] as const} valor={g.exhibicion} onCambio={(x) => set('exhibicion', x)} />
          </Campo>
          <Campo etiqueta="Material POP">
            <Segmentado opciones={['Instalado', 'No hay'] as const} valor={g.pop ? 'Instalado' : 'No hay'} onCambio={(x) => set('pop', x === 'Instalado')} />
          </Campo>
          <Campo etiqueta="Promociones activas">
            <input className={claseInput} value={g.promociones} onChange={(e) => set('promociones', e.target.value)} />
          </Campo>
          <div>
            <span className="mb-1.5 block text-sm font-medium">Actividades realizadas</span>
            <Chips opciones={listas.actividades} valor={g.actividades} onCambio={(x) => set('actividades', x)} />
          </div>
        </div>
      </Bloque>
      <Bloque>
        <div className="space-y-4">
          <Campo etiqueta="Competencia observada">
            <input className={claseInput} value={g.competencia} onChange={(e) => set('competencia', e.target.value)} placeholder="Ej.: nueva marca de magnesio en góndola" />
          </Campo>
          <Campo etiqueta="Oportunidades detectadas">
            <input className={claseInput} value={g.oportunidades} onChange={(e) => set('oportunidades', e.target.value)} placeholder="Ej.: espacio libre en cabecera" />
          </Campo>
          <Campo etiqueta="Novedades">
            <textarea rows={2} className={claseInput} value={g.novedades} onChange={(e) => set('novedades', e.target.value)} />
          </Campo>
        </div>
      </Bloque>
      <BotonSalida onClick={() => onGuardar({ ...g, competencia: g.competencia || 'Sin novedad', oportunidades: g.oportunidades || 'Ninguna', novedades: g.novedades || 'Sin novedades' })} />
    </form>
  )
}

function FormVendedora({ visita, listas, onGuardar }: { visita: Visita; listas: ReturnType<typeof useDemo.getState>['listas']; onGuardar: (g: GestionVendedora) => void }) {
  const hoy = hoyDemo()
  const d1 = siguienteHabil(hoy)
  const d2 = siguienteHabil(d1)
  const opcionesFecha = [d1, d2, siguienteHabil(siguienteHabil(siguienteHabil(d2)))]
  const [g, setG] = useState<GestionVendedora>({
    gestion: visita.tipo,
    valorPedido: 1_850_000,
    recaudo: 0,
    seguimiento: 'Se confirmó la entrega del pedido anterior',
    novedades: '',
    proximaAccion: 'Llamar para confirmar pedido',
    fechaCompromiso: opcionesFecha[0],
  })
  const set = <K extends keyof GestionVendedora>(k: K, val: GestionVendedora[K]) => setG({ ...g, [k]: val })
  const dinero = (k: 'valorPedido' | 'recaudo') => (
    <input
      inputMode="numeric"
      className={`${claseInput} tabular`}
      value={g[k] ? pesos(g[k]) : ''}
      placeholder="$ 0"
      onChange={(e) => set(k, Number(e.target.value.replace(/\D/g, '')) || 0)}
    />
  )
  return (
    <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
      <Bloque>
        <div className="space-y-4">
          <div className="text-sm text-gris">Objetivo: {visita.objetivo}</div>
          <Campo etiqueta="Gestión realizada">
            <select className={claseInput} value={g.gestion} onChange={(e) => set('gestion', e.target.value)}>
              {listas.tiposVisita.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Valor del pedido">{dinero('valorPedido')}</Campo>
            <Campo etiqueta="Recaudo">{dinero('recaudo')}</Campo>
          </div>
          {g.valorPedido === 0 && (
            <Campo etiqueta="Motivo de no venta">
              <select className={claseInput} value={g.motivoNoVenta ?? ''} onChange={(e) => set('motivoNoVenta', e.target.value)}>
                <option value="">Selecciona un motivo</option>
                {listas.motivosNoVenta.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Campo>
          )}
        </div>
      </Bloque>
      <Bloque>
        <div className="space-y-4">
          <Campo etiqueta="Seguimiento a compromisos anteriores">
            <input className={claseInput} value={g.seguimiento} onChange={(e) => set('seguimiento', e.target.value)} />
          </Campo>
          <Campo etiqueta="Novedades">
            <textarea rows={2} className={claseInput} value={g.novedades} onChange={(e) => set('novedades', e.target.value)} placeholder="Ej.: solicitan material POP para la vitrina" />
          </Campo>
          <Campo etiqueta="Próxima acción o compromiso">
            <input className={claseInput} value={g.proximaAccion} onChange={(e) => set('proximaAccion', e.target.value)} />
          </Campo>
          <Campo etiqueta="Fecha del compromiso">
            <select className={claseInput} value={g.fechaCompromiso} onChange={(e) => set('fechaCompromiso', e.target.value)}>
              {opcionesFecha.map((f) => (
                <option key={f} value={f}>
                  {fechaLarga(f)}
                </option>
              ))}
            </select>
          </Campo>
        </div>
      </Bloque>
      <BotonSalida onClick={() => onGuardar({ ...g, novedades: g.novedades || 'Sin novedades' })} />
    </form>
  )
}

function Resumen({ visita: v }: { visita: Visita }) {
  const p = useDemo((s) => s.puntos.find((x) => x.id === v.puntoId))
  return (
    <div className="space-y-3">
      <Bloque>
        <div className="flex items-center justify-between">
          <span className="font-semibold">Resumen</span>
          <EstadoChip estado={v.estado} pequeño />
        </div>
        {v.estado === 'realizada' && (
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-gris">Llegada</dt>
              <dd className="font-medium tabular">{v.llegada}</dd>
            </div>
            <div>
              <dt className="text-xs text-gris">Salida</dt>
              <dd className="font-medium tabular">{v.salida}</dd>
            </div>
            {v.vendedora && (
              <>
                <div>
                  <dt className="text-xs text-gris">Pedido</dt>
                  <dd className="font-medium tabular">{pesos(v.vendedora.valorPedido)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gris">Recaudo</dt>
                  <dd className="font-medium tabular">{pesos(v.vendedora.recaudo)}</dd>
                </div>
              </>
            )}
            {v.impulsadora && (
              <>
                <div>
                  <dt className="text-xs text-gris">Unidades vendidas</dt>
                  <dd className="font-medium tabular">{v.impulsadora.unidades}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gris">Agotados</dt>
                  <dd className="font-medium">{v.impulsadora.agotados.length ? v.impulsadora.agotados.join(', ') : 'Ninguno'}</dd>
                </div>
              </>
            )}
          </dl>
        )}
        {v.estado === 'no_realizada' && <p className="mt-2 text-sm text-gris">Motivo: {v.motivoNoRealizacion}</p>}
        {v.estado === 'reprogramada' && <p className="mt-2 text-sm text-gris">Supervisión movió esta visita a otra fecha.</p>}
      </Bloque>
      {v.estado === 'realizada' && <FotoVisita visita={v} punto={p} className="aspect-[4/3] w-full" />}
    </div>
  )
}
