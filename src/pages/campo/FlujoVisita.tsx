import { ArrowLeft, Camera, Check, CheckCircle2, CloudOff, Info, Loader2, LogIn, LogOut, MapPin, MapPinPlus, Minus, Plus } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Camara } from '../../components/Camara'
import { FotoVisita } from '../../components/FotoVisita'
import { EditorFaltantes, FormNovedad, ListaNovedades } from '../../components/Novedades'
import { Boton, Campo, claseInput, EstadoChip } from '../../components/ui'
import type { EstadoCartera, GestionImpulsadora, GestionVendedora, Listas, Visita } from '../../data/types'
import { fechaLarga, horaActual, hoyDemo, pesos, siguienteHabil } from '../../lib/fechas'
import { useDemo } from '../../store'

type Paso = 'llegada' | 'foto' | 'jornada' | 'formulario' | 'exhibicion' | 'listo'

export function FlujoVisita() {
  const { id } = useParams()
  const nav = useNavigate()
  const v = useDemo((s) => s.visitas.find((x) => x.id === id))
  const p = useDemo((s) => s.puntos.find((x) => x.id === v?.puntoId))
  const usuario = useDemo((s) => s.usuarios.find((u) => u.id === s.sesion))
  const visitas = useDemo((s) => s.visitas)
  const enLinea = useDemo((s) => s.enLinea)
  const { registrarLlegada, guardarFoto, usarFotoDemo, finalizarVisita, marcarNoRealizada, listas } = useDemo()
  const esVendedora = usuario?.perfil === 'vendedora'

  // Vendedoras: una sola foto al inicio de la jornada, asociada a la primera visita del día
  const fotoJornada = v && esVendedora ? visitas.find((x) => x.usuarioId === v.usuarioId && x.fecha === v.fecha && x.id !== v.id && (x.foto || x.fotoSemilla)) : undefined
  // Impulsadoras: registran llegada y foto del almacén al empezar; al final del día cierran con
  // unidades vendidas, faltantes y la foto de la exhibición.
  const pasos: { k: Exclude<Paso, 'listo' | 'jornada'>; t: string }[] = esVendedora
    ? [{ k: 'llegada', t: 'Llegada' }, ...(fotoJornada ? [] : [{ k: 'foto' as const, t: 'Foto de jornada' }]), { k: 'formulario', t: 'Gestión' }]
    : [
        { k: 'llegada', t: 'Llegada' },
        { k: 'foto', t: 'Foto del almacén' },
        { k: 'formulario', t: 'Cierre del día' },
        { k: 'exhibicion', t: 'Foto exhibición' },
      ]

  const tieneFoto = (x: Visita) => !!(x.foto || x.fotoSemilla)
  const inicial: Paso = (() => {
    if (!v || v.estado !== 'programada') return 'listo'
    if (!v.llegada) return 'llegada'
    if (pasos.some((x) => x.k === 'foto') && !tieneFoto(v)) return 'foto'
    return esVendedora ? 'formulario' : 'jornada'
  })()
  const [paso, setPaso] = useState<Paso>(inicial)
  const [ubicando, setUbicando] = useState(false)
  const [noRealizada, setNoRealizada] = useState(false)
  const [recienCerrada, setRecienCerrada] = useState(false)
  const [cierre, setCierre] = useState<GestionImpulsadora | null>(null)
  // Cada paso empieza arriba de la pantalla
  useEffect(() => {
    document.getElementById('campo-scroll')?.scrollTo(0, 0)
    window.scrollTo(0, 0)
  }, [paso])

  if (!v || !p || !usuario) return <p className="p-4 text-gris">No encontramos esta visita.</p>

  const siguiente = (desde: Paso) => {
    const i = pasos.findIndex((x) => x.k === desde)
    setPaso(pasos[i + 1]?.k ?? 'formulario')
  }
  const llegar = () => {
    setUbicando(true)
    setTimeout(() => {
      registrarLlegada(v.id, { hora: horaActual(), distanciaM: 12 + Math.floor(Math.random() * 48), enRango: true })
      setUbicando(false)
    }, 1600)
  }
  const esDeHoy = v.fecha === hoyDemo()

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-10 bg-niebla px-4 pt-3 pb-2">
        <Link to={esDeHoy ? '/campo' : '/campo/anteriores'} className="inline-flex items-center gap-1 text-sm font-medium text-gris">
          <ArrowLeft size={16} aria-hidden /> {esDeHoy ? 'Ruta de hoy' : 'Visitas anteriores'}
        </Link>
        <h1 className="mt-1 text-lg leading-tight font-bold">{p.nombre}</h1>
        <p className="text-xs text-gris">
          {p.codigo} · {p.direccion || 'Sin dirección registrada'} · {p.zona}
        </p>
        {paso !== 'listo' && (
          <ol className="mt-3 flex gap-1.5" aria-label="Pasos de la visita">
            {pasos.map((x, i) => {
              // En jornada: llegada y foto hechas, el cierre aún no empieza
              const idx = paso === 'jornada' ? 1.5 : pasos.findIndex((y) => y.k === paso)
              const hecho = i < idx
              const actual = i === idx
              return (
                <li key={x.k} className="min-w-0 flex-1">
                  <div className={`h-1.5 rounded-full ${hecho ? 'bg-hoja' : actual ? 'bg-cobalto' : 'bg-cobalto-100'}`} />
                  <div className={`mt-1 truncate text-[11px] font-medium ${actual ? 'text-cobalto' : 'text-gris'}`}>{x.t}</div>
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
              {p.ubicacionOrigen === 'pendiente' && !v.llegada && (
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-cobalto-50 p-3 text-sm text-cobalto">
                  <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
                  Este cliente no tiene dirección completa en la base de datos. Al registrar la llegada, la ubicación del GPS quedará como referencia del punto.
                </p>
              )}
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
                  {v.ubicacionTomada ? (
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cobalto-50 text-cobalto">
                        <MapPinPlus size={20} aria-hidden />
                      </span>
                      <div>
                        <div className="font-semibold text-cobalto">Ubicación del cliente registrada</div>
                        <div className="text-sm text-gris">
                          Llegada a las <strong className="text-tinta tabular">{v.llegada}</strong>. Desde hoy las visitas a este cliente se validan contra esta ubicación.
                        </div>
                      </div>
                    </div>
                  ) : (
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
                  )}
                </Bloque>
                <Boton className="w-full py-3.5" onClick={() => siguiente('llegada')}>
                  {pasos[1].k === 'foto' ? (esVendedora ? 'Tomar foto de inicio de jornada' : 'Continuar con la foto del almacén') : 'Registrar la gestión'}
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
          <div className="space-y-3">
            <Indicacion>
              {esVendedora
                ? 'Foto de inicio de jornada. Es la única foto del día: queda asociada a esta primera visita como evidencia de la actividad en campo.'
                : 'Foto de llegada al almacén, como evidencia de presencia.'}
            </Indicacion>
            <Camara
              key="presencia"
              onFoto={(f) => {
                guardarFoto(v.id, f, 'presencia')
                if (esVendedora) siguiente('foto')
                else setPaso('jornada')
              }}
              onSinCamara={() => {
                usarFotoDemo(v.id, 'presencia')
                if (esVendedora) siguiente('foto')
                else setPaso('jornada')
              }}
            />
          </div>
        )}

        {paso === 'jornada' && (
          <div className="space-y-3">
            <Bloque>
              <div className="flex items-start gap-3">
                <span className="relative mt-1 flex h-3 w-3 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hoja opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-hoja" />
                </span>
                <div>
                  <div className="font-semibold">Jornada en curso desde las {v.llegada}</div>
                  <p className="mt-1 text-sm text-gris">Llegada y foto del almacén registradas. Al final del día registra las unidades vendidas, los faltantes y la foto de la exhibición.</p>
                </div>
              </div>
            </Bloque>
            <FotoVisita visita={v} punto={p} className="aspect-[4/3] w-full" />
            <Boton className="w-full py-4 text-base" onClick={() => setPaso('formulario')}>
              <LogOut size={18} aria-hidden /> Cerrar la jornada
            </Boton>
          </div>
        )}

        {paso === 'exhibicion' && (
          <div className="space-y-3">
            <Indicacion>Última foto del día: la exhibición, donde se vean la ubicación y el estado de los productos de Natural Systems. Al usarla se registra la salida.</Indicacion>
            <Camara
              key="exhibicion"
              onFoto={(f) => {
                guardarFoto(v.id, f, 'exhibicion')
                if (cierre) finalizarVisita(v.id, horaActual(), { impulsadora: cierre })
                setRecienCerrada(true)
                setPaso('listo')
              }}
              onSinCamara={() => {
                usarFotoDemo(v.id, 'exhibicion')
                if (cierre) finalizarVisita(v.id, horaActual(), { impulsadora: cierre })
                setRecienCerrada(true)
                setPaso('listo')
              }}
            />
          </div>
        )}

        {paso === 'formulario' &&
          (esVendedora ? (
            <>
              {fotoJornada && (
                <p className="mb-3 flex items-start gap-2 rounded-xl bg-white p-3 text-sm text-gris">
                  <Camera size={16} className="mt-0.5 shrink-0 text-hoja" aria-hidden />
                  La foto de inicio de jornada ya se registró a las {fotoJornada.llegada}. En esta visita no se pide foto.
                </p>
              )}
              <FormVendedora
                visita={v}
                listas={listas}
                onGuardar={(g) => {
                  finalizarVisita(v.id, horaActual(), { vendedora: g })
                  setRecienCerrada(true)
                  setPaso('listo')
                }}
              />
            </>
          ) : (
            <>
            <p className="mb-3 rounded-xl bg-white p-3 text-sm text-gris">
              <strong className="text-tinta">Cierre del día.</strong> Registra lo que pasó durante la jornada en {p.nombre}; al final se toma la foto de la exhibición.
            </p>
            <FormImpulsadora
              listas={listas}
              onGuardar={(g) => {
                setCierre(g)
                setPaso('exhibicion')
              }}
            />
            </>
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
                    ? 'El Director Comercial ya la ve en el panel.'
                    : 'Quedó guardada en el dispositivo con su hora y ubicación. Se enviará sola cuando vuelva la señal.'}
                </p>
              </div>
            )}
            <Resumen visita={v} autor={usuario.nombre} />
            <Boton className="w-full py-3.5" onClick={() => nav(esDeHoy ? '/campo' : '/campo/anteriores')}>
              {esDeHoy ? 'Volver a la ruta' : 'Volver a visitas anteriores'}
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

function Indicacion({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-white p-3 text-sm text-gris">
      <Camera size={16} className="mt-0.5 shrink-0 text-cobalto" aria-hidden />
      {children}
    </p>
  )
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

function Grupo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={etiqueta}>
      <span className="mb-1.5 block text-sm font-medium">{etiqueta}</span>
      {children}
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

function BotonSalida({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Boton type="submit" className="w-full py-4 text-base" onClick={onClick} disabled={disabled}>
      <LogOut size={18} aria-hidden /> Registrar salida y guardar
    </Boton>
  )
}

function Contador({ etiqueta, valor, onCambio }: { etiqueta: string; valor: number; onCambio: (n: number) => void }) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">{etiqueta}</span>
      <div className="flex items-center gap-3">
        <button type="button" aria-label="Restar" onClick={() => onCambio(Math.max(0, valor - 1))} className="flex h-11 w-11 items-center justify-center rounded-xl border border-linea bg-white">
          <Minus size={18} />
        </button>
        <input aria-label={etiqueta} inputMode="numeric" className={`${claseInput} w-20 text-center text-lg font-bold tabular`} value={valor} onChange={(e) => onCambio(Number(e.target.value.replace(/\D/g, '')) || 0)} />
        <button type="button" aria-label="Sumar" onClick={() => onCambio(valor + 1)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-linea bg-white">
          <Plus size={18} />
        </button>
      </div>
    </div>
  )
}

function FormImpulsadora({ listas, onGuardar }: { listas: Listas; onGuardar: (g: GestionImpulsadora) => void }) {
  const [g, setG] = useState<GestionImpulsadora>({
    asistencia: true,
    faltantes: [],
    unidades: 12,
    exhibicion: 'Buena',
    pop: true,
    popObservaciones: '',
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
          <Grupo etiqueta="Asistencia al punto">
            <Segmentado opciones={['Asistí', 'No asistí'] as const} valor={g.asistencia ? 'Asistí' : 'No asistí'} onCambio={(x) => set('asistencia', x === 'Asistí')} />
          </Grupo>
          <Contador etiqueta="Unidades vendidas" valor={g.unidades} onCambio={(n) => set('unidades', n)} />
          <div>
            <span className="mb-1.5 block text-sm font-medium">Faltantes de producto en el punto</span>
            <EditorFaltantes productos={listas.productos} valor={g.faltantes} onCambio={(x) => set('faltantes', x)} />
          </div>
        </div>
      </Bloque>
      <Bloque>
        <div className="space-y-4">
          <Grupo etiqueta="Exhibición">
            <Segmentado opciones={['Buena', 'Regular', 'Deficiente'] as const} valor={g.exhibicion} onCambio={(x) => set('exhibicion', x)} />
          </Grupo>
          <Grupo etiqueta="Material POP">
            <Segmentado opciones={['Instalado', 'No hay'] as const} valor={g.pop ? 'Instalado' : 'No hay'} onCambio={(x) => set('pop', x === 'Instalado')} />
          </Grupo>
          <Campo etiqueta="Observaciones del material POP">
            <textarea
              rows={2}
              className={claseInput}
              value={g.popObservaciones}
              onChange={(e) => set('popObservaciones', e.target.value)}
              placeholder="Ej.: el cliente no permite instalar habladores ni afiches"
            />
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
      <Boton type="submit" className="w-full py-4 text-base" onClick={() => onGuardar({ ...g, competencia: g.competencia || 'Sin novedad', oportunidades: g.oportunidades || 'Ninguna', novedades: g.novedades || 'Sin novedades' })}>
        <Camera size={18} aria-hidden /> Continuar con la foto de la exhibición
      </Boton>
    </form>
  )
}

function FormVendedora({ visita, listas, onGuardar }: { visita: Visita; listas: Listas; onGuardar: (g: GestionVendedora) => void }) {
  const hoy = hoyDemo()
  const d1 = siguienteHabil(hoy)
  const d2 = siguienteHabil(d1)
  const opcionesFecha = [d1, d2, siguienteHabil(siguienteHabil(siguienteHabil(d2)))]
  const [g, setG] = useState<GestionVendedora>({
    gestion: listas.gestiones.includes(visita.tipo) ? visita.tipo : listas.gestiones[0],
    estimadoPedido: 1_850_000,
    unidadesPedido: 52,
    estadoCartera: 'Al día',
    faltantes: [],
    seguimiento: 'Se confirmó la entrega del pedido anterior',
    novedades: '',
    proximaAccion: 'Llamar para confirmar pedido',
    fechaCompromiso: opcionesFecha[0],
  })
  const set = <K extends keyof GestionVendedora>(k: K, val: GestionVendedora[K]) => setG({ ...g, [k]: val })
  const faltaOtro = g.gestion === 'Otros' && !g.gestionOtro?.trim()
  return (
    <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
      <Bloque>
        <div className="space-y-4">
          <div className="text-sm text-gris">Objetivo: {visita.objetivo}</div>
          <Campo etiqueta="Gestión realizada">
            <select className={claseInput} value={g.gestion} onChange={(e) => set('gestion', e.target.value)}>
              {listas.gestiones.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Campo>
          {g.gestion === 'Otros' && (
            <Campo etiqueta="Describe la gestión">
              <textarea rows={2} className={claseInput} value={g.gestionOtro ?? ''} onChange={(e) => set('gestionOtro', e.target.value)} placeholder="Ej.: entrega de muestras al médico del punto" />
            </Campo>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Estimado de pedido">
              <input
                inputMode="numeric"
                className={`${claseInput} tabular`}
                value={g.estimadoPedido ? pesos(g.estimadoPedido) : ''}
                placeholder="$ 0"
                onChange={(e) => set('estimadoPedido', Number(e.target.value.replace(/\D/g, '')) || 0)}
              />
            </Campo>
            <Campo etiqueta="Unidades del pedido">
              <input inputMode="numeric" className={`${claseInput} tabular`} value={g.unidadesPedido || ''} placeholder="0" onChange={(e) => set('unidadesPedido', Number(e.target.value.replace(/\D/g, '')) || 0)} />
            </Campo>
          </div>
          {g.estimadoPedido === 0 && (
            <Campo etiqueta="Motivo de no venta">
              <select className={claseInput} value={g.motivoNoVenta ?? ''} onChange={(e) => set('motivoNoVenta', e.target.value)}>
                <option value="">Selecciona un motivo</option>
                {listas.motivosNoVenta.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Campo>
          )}
          <Grupo etiqueta="Estado de la cartera del cliente">
            <Segmentado opciones={['Al día', 'Vencida'] as const} valor={g.estadoCartera} onCambio={(x: EstadoCartera) => set('estadoCartera', x)} />
          </Grupo>
        </div>
      </Bloque>
      <Bloque>
        <span className="mb-1.5 block text-sm font-medium">Faltantes de producto en el punto</span>
        <EditorFaltantes productos={listas.productos} valor={g.faltantes} onCambio={(x) => set('faltantes', x)} />
      </Bloque>
      <Bloque>
        <div className="space-y-4">
          <Campo etiqueta="Seguimiento a compromisos y novedades anteriores">
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
      <BotonSalida disabled={faltaOtro} onClick={() => onGuardar({ ...g, novedades: g.novedades || 'Sin novedades' })} />
    </form>
  )
}

function Resumen({ visita: v, autor }: { visita: Visita; autor: string }) {
  const p = useDemo((s) => s.puntos.find((x) => x.id === v.puntoId))
  const [agregando, setAgregando] = useState(false)
  const fal = v.vendedora?.faltantes ?? v.impulsadora?.faltantes ?? []
  return (
    <div className="space-y-3">
      <Bloque>
        <div className="flex items-center justify-between">
          <span className="font-semibold">Resumen</span>
          <EstadoChip estado={v.estado} pequeño />
        </div>
        {v.estado === 'realizada' && (
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <Dato e="Llegada" v={v.llegada} />
            <Dato e="Salida" v={v.salida} />
            {v.vendedora && (
              <>
                <Dato e="Estimado de pedido" v={pesos(v.vendedora.estimadoPedido)} />
                <Dato e="Unidades del pedido" v={`${v.vendedora.unidadesPedido}`} />
                <Dato e="Cartera" v={v.vendedora.estadoCartera} />
                <Dato e="Gestión" v={v.vendedora.gestion === 'Otros' ? `Otros: ${v.vendedora.gestionOtro}` : v.vendedora.gestion} />
              </>
            )}
            {v.impulsadora && <Dato e="Unidades vendidas" v={`${v.impulsadora.unidades}`} />}
            <div className="col-span-2">
              <dt className="text-xs text-gris">Faltantes</dt>
              <dd className="font-medium">{fal.length ? fal.map((f) => `${f.producto} (${f.cantidad})`).join(', ') : 'Ninguno'}</dd>
            </div>
          </dl>
        )}
        {v.estado === 'no_realizada' && <p className="mt-2 text-sm text-gris">Motivo: {v.motivoNoRealizacion}</p>}
        {v.estado === 'reprogramada' && <p className="mt-2 text-sm text-gris">Supervisión movió esta visita a otra fecha.</p>}
      </Bloque>

      {v.estado === 'realizada' && (
        <div className={`grid gap-2 ${v.impulsadora ? 'grid-cols-2' : ''}`}>
          <FotoVisita visita={v} punto={p} compacta={!!v.impulsadora} className="aspect-[4/3] w-full" />
          {v.impulsadora && <FotoVisita visita={v} punto={p} tipo="exhibicion" compacta className="aspect-[4/3] w-full" />}
        </div>
      )}

      {v.estado === 'realizada' && (
        <Bloque>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">Novedades después del cierre</span>
            {!agregando && (
              <button onClick={() => setAgregando(true)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-cobalto hover:bg-cobalto-50">
                <Plus size={15} aria-hidden /> Agregar
              </button>
            )}
          </div>
          <div className="mt-3">{agregando ? <FormNovedad visitaId={v.id} autor={autor} onListo={() => setAgregando(false)} /> : <ListaNovedades novedades={v.novedadesPosteriores} />}</div>
        </Bloque>
      )}
    </div>
  )
}

function Dato({ e, v }: { e: string; v?: string }) {
  return (
    <div>
      <dt className="text-xs text-gris">{e}</dt>
      <dd className="font-medium tabular">{v ?? '—'}</dd>
    </div>
  )
}
