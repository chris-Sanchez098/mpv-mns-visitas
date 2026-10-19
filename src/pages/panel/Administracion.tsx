import { FileSpreadsheet, MapPin, MapPinOff, MapPinPlus, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { ImportarExcel } from '../../components/ImportarExcel'
import { EnlacePolitica } from '../../components/PoliticaDatos'
import { Boton, Campo, claseInput, claseSelect, Modal } from '../../components/ui'
import { COLUMNAS_CLIENTES, descargarPlantilla, revisarClientes } from '../../lib/importar'
import { fechaCorta } from '../../lib/fechas'
import { PERFIL_NOMBRE, type Listas, type Perfil } from '../../data/types'
import { useDemo } from '../../store'

type Pestaña = 'usuarios' | 'puntos' | 'listas'

const NOMBRE_LISTA: Record<keyof Listas, string> = {
  zonas: 'Zonas',
  canales: 'Canales de punto de venta',
  tiposVisita: 'Tipos de visita',
  objetivos: 'Objetivos de visita',
  motivosNoVenta: 'Motivos de no venta',
  motivosNoRealizacion: 'Motivos de no realización',
  productos: 'Productos',
  actividades: 'Actividades de impulso',
  gestiones: 'Gestiones de vendedoras',
  motivosNovedad: 'Motivos de novedad posterior',
  franjas: 'Franjas horarias',
}

/** Filas de ejemplo: 3 clientes nuevos (uno sin dirección), 1 que actualiza un código existente y 1 con error. */
const EJEMPLO_CLIENTES = [
  { 'Código': 'CL-2001', Nombre: 'Droguería Santa Isabel', Canal: 'Droguería', Zona: 'Cali Sur', 'Dirección': 'Calle 5 # 66-20', Contacto: 'Marta Ríos', Latitud: 3.3795, Longitud: -76.5401 },
  { 'Código': 'CL-2002', Nombre: 'Naturista Vida Plena', Canal: 'Tienda naturista', Zona: 'Palmira', 'Dirección': 'Carrera 28 # 30-15', Contacto: 'Luis Arce', Latitud: '', Longitud: '' },
  { 'Código': 'CL-2003', Nombre: 'Minimercado El Paraíso', Canal: 'Supermercado', Zona: 'Jamundí', 'Dirección': '', Contacto: 'Nubia Peña', Latitud: '', Longitud: '' },
  { 'Código': 'CL-1003', Nombre: 'Droguería Vipasa', Canal: 'Droguería', Zona: 'Cali Norte', 'Dirección': 'Avenida 6N # 52-10', Contacto: 'Hernán Sierra', Latitud: '', Longitud: '' },
  { 'Código': 'CL-2004', Nombre: 'Farmacia La 70', Canal: 'Farmacia de cadena', Zona: 'Buga', 'Dirección': 'Calle 70 # 2-10', Contacto: '', Latitud: '', Longitud: '' },
]

export function Administracion() {
  const [pestaña, setPestaña] = useState<Pestaña>('usuarios')
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Administración</h1>
          <p className="mt-1 text-gris">La información base de la operación, mantenida por la compañía.</p>
        </div>
      </div>
      <div className="flex gap-1 border-b border-linea" role="tablist">
        {(
          [
            ['usuarios', 'Usuarios y perfiles'],
            ['puntos', 'Clientes y puntos de venta'],
            ['listas', 'Listas configurables'],
          ] as const
        ).map(([k, t]) => (
          <button
            key={k}
            role="tab"
            aria-selected={pestaña === k}
            onClick={() => setPestaña(k)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-[15px] font-semibold ${pestaña === k ? 'border-cobalto text-cobalto' : 'border-transparent text-gris hover:text-tinta'}`}
          >
            {t}
          </button>
        ))}
      </div>
      {pestaña === 'usuarios' && <Usuarios />}
      {pestaña === 'puntos' && <Puntos />}
      {pestaña === 'listas' && <ListasConfig />}
    </div>
  )
}

function Usuarios() {
  const { usuarios, listas, agregarUsuario, avisar } = useDemo()
  const [q, setQ] = useState('')
  const [nuevo, setNuevo] = useState(false)
  const filtrados = usuarios.filter((u) => u.nombre.toLowerCase().includes(q.toLowerCase()))
  const conteo = (p: Perfil) => usuarios.filter((u) => u.perfil === p).length

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gris">
          {conteo('impulsadora')} impulsadoras, {conteo('vendedora')} vendedoras y {conteo('supervision') + conteo('administracion') + conteo('direccion')} usuarios de oficina
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <EnlacePolitica className="mr-2 text-sm font-medium text-cobalto" />
          <label className="relative">
            <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-gris" aria-hidden />
            <input className={`${claseInput} py-2 pl-9 text-sm`} placeholder="Buscar por nombre" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar usuario" />
          </label>
          <Boton onClick={() => setNuevo(true)}>
            <Plus size={17} aria-hidden /> Agregar usuario
          </Boton>
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-linea bg-white">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="border-b border-linea text-left text-xs text-gris">
            <tr>
              <th className="px-5 py-3 font-medium">Nombre</th>
              <th className="py-3 font-medium">Perfil</th>
              <th className="py-3 font-medium">Zonas</th>
              <th className="py-3 font-medium">Teléfono</th>
              <th className="py-3 font-medium">Autorización de datos</th>
              <th className="px-5 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linea">
            {filtrados.map((u) => (
              <tr key={u.id}>
                <td className="px-5 py-2.5 font-medium">{u.nombre}</td>
                <td className="py-2.5">{PERFIL_NOMBRE[u.perfil]}</td>
                <td className="py-2.5 text-gris">{u.zonas.length === listas.zonas.length ? 'Todas' : u.zonas.join(', ')}</td>
                <td className="py-2.5 tabular">{u.telefono}</td>
                <td className="py-2.5 text-xs tabular">
                  {u.autorizacionDatos ? (
                    <span className="text-hoja" title="Aceptó la autorización de tratamiento de datos">
                      Aceptada {fechaCorta(u.autorizacionDatos.slice(0, 10))}, {u.autorizacionDatos.slice(11)}
                    </span>
                  ) : (
                    <span className="rounded-full bg-ambar-50 px-2 py-0.5 font-medium text-ambar">Pendiente</span>
                  )}
                </td>
                <td className="px-5 py-2.5">
                  <span className="rounded-full bg-hoja-50 px-2 py-0.5 text-xs font-medium text-hoja">Activo</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {nuevo && (
        <ModalUsuario
          zonas={listas.zonas}
          onCerrar={() => setNuevo(false)}
          onGuardar={(u) => {
            agregarUsuario(u)
            avisar(`${u.nombre} ya puede ingresar como ${PERFIL_NOMBRE[u.perfil].toLowerCase()}`)
            setNuevo(false)
          }}
        />
      )}
    </>
  )
}

function ModalUsuario({ zonas, onCerrar, onGuardar }: { zonas: string[]; onCerrar: () => void; onGuardar: (u: { nombre: string; perfil: Perfil; zonas: string[]; telefono: string; activo: boolean }) => void }) {
  const [nombre, setNombre] = useState('')
  const [perfil, setPerfil] = useState<Perfil>('impulsadora')
  const [zona, setZona] = useState(zonas[0])
  const [telefono, setTelefono] = useState('')
  return (
    <Modal titulo="Agregar usuario" onCerrar={onCerrar}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!nombre.trim()) return
          onGuardar({ nombre: nombre.trim(), perfil, zonas: perfil === 'impulsadora' || perfil === 'vendedora' ? [zona] : [...zonas], telefono: telefono || '—', activo: true })
        }}
      >
        <Campo etiqueta="Nombre completo">
          <input required className={claseInput} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej.: Sofía Jaramillo" />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Perfil">
            <select className={claseInput} value={perfil} onChange={(e) => setPerfil(e.target.value as Perfil)}>
              {(Object.keys(PERFIL_NOMBRE) as Perfil[]).map((p) => (
                <option key={p} value={p}>
                  {PERFIL_NOMBRE[p]}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Zona">
            <select className={claseInput} value={zona} onChange={(e) => setZona(e.target.value)} disabled={perfil !== 'impulsadora' && perfil !== 'vendedora'}>
              {zonas.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          </Campo>
        </div>
        <Campo etiqueta="Teléfono">
          <input className={claseInput} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="300 000 0000" inputMode="tel" />
        </Campo>
        <div className="flex justify-end gap-2 pt-2">
          <Boton type="button" variante="fantasma" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit">Guardar usuario</Boton>
        </div>
      </form>
    </Modal>
  )
}

function Puntos() {
  const { puntos, listas, agregarPunto, importarPuntos, avisar } = useDemo()
  const [zona, setZona] = useState('')
  const [nuevo, setNuevo] = useState(false)
  const [importando, setImportando] = useState(false)
  const [f, setF] = useState({ codigo: '', nombre: '', canal: listas.canales[0], zona: listas.zonas[0], direccion: '', contacto: '' })
  const lista = puntos.filter((p) => !zona || p.zona === zona)
  const sinDireccion = puntos.filter((p) => !p.direccion).length
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select aria-label="Zona" className={claseSelect} value={zona} onChange={(e) => setZona(e.target.value)}>
          <option value="">Todas las zonas ({puntos.length} puntos)</option>
          {listas.zonas.map((z) => (
            <option key={z}>{z}</option>
          ))}
        </select>
        <span className="text-sm text-gris">{sinDireccion} clientes sin dirección completa</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Boton variante="secundario" onClick={() => setImportando(true)}>
            <FileSpreadsheet size={17} aria-hidden /> Cargar desde Excel
          </Boton>
          <Boton onClick={() => setNuevo(true)}>
            <Plus size={17} aria-hidden /> Agregar punto de venta
          </Boton>
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-linea bg-white">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="border-b border-linea text-left text-xs text-gris">
            <tr>
              <th className="px-5 py-3 font-medium">Código</th>
              <th className="py-3 font-medium">Punto de venta</th>
              <th className="py-3 font-medium">Canal</th>
              <th className="py-3 font-medium">Zona</th>
              <th className="py-3 font-medium">Dirección</th>
              <th className="py-3 font-medium">Contacto</th>
              <th className="px-5 py-3 font-medium">Ubicación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linea">
            {lista.map((p) => (
              <tr key={p.id}>
                <td className="px-5 py-2.5 text-gris tabular">{p.codigo}</td>
                <td className="py-2.5 font-medium">{p.nombre}</td>
                <td className="py-2.5">{p.canal}</td>
                <td className="py-2.5">{p.zona}</td>
                <td className="py-2.5 text-gris">{p.direccion || <span className="rounded-full bg-ambar-50 px-2 py-0.5 text-xs font-medium text-ambar">Sin dirección</span>}</td>
                <td className="py-2.5">{p.contacto}</td>
                <td className="px-5 py-2.5 text-xs text-gris tabular">
                  {p.lat === undefined || p.lng === undefined ? (
                    <span className="inline-flex items-center gap-1 text-ambar">
                      <MapPinOff size={13} aria-hidden /> Se toma en la primera visita
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1" title={p.ubicacionOrigen === 'visita' ? 'Ubicación tomada con el GPS en una visita' : 'Ubicación de la base de datos'}>
                      {p.ubicacionOrigen === 'visita' ? <MapPinPlus size={13} className="text-cobalto" aria-hidden /> : <MapPin size={13} aria-hidden />}
                      {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                      {p.ubicacionOrigen === 'visita' && p.ubicacionFecha && <span className="text-cobalto">· visita {fechaCorta(p.ubicacionFecha)}</span>}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {nuevo && (
        <Modal titulo="Agregar punto de venta" onCerrar={() => setNuevo(false)}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!f.nombre.trim()) return
              agregarPunto({ ...f, codigo: f.codigo.trim() || `CL-${3000 + puntos.length}`, nombre: f.nombre.trim(), contacto: f.contacto || '—', ubicacionOrigen: 'pendiente' })
              avisar(`${f.nombre} quedó disponible para planificar visitas`)
              setNuevo(false)
            }}
          >
            <Campo etiqueta="Código del cliente" ayuda="El mismo código del sistema comercial. Evita duplicados en las cargas por Excel.">
              <input className={claseInput} value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value })} placeholder="Ej.: CL-3001" />
            </Campo>
            <Campo etiqueta="Nombre del punto">
              <input required className={claseInput} value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} placeholder="Ej.: Droguería La Merced" />
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo etiqueta="Canal">
                <select className={claseInput} value={f.canal} onChange={(e) => setF({ ...f, canal: e.target.value })}>
                  {listas.canales.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="Zona">
                <select className={claseInput} value={f.zona} onChange={(e) => setF({ ...f, zona: e.target.value })}>
                  {listas.zonas.map((z) => (
                    <option key={z}>{z}</option>
                  ))}
                </select>
              </Campo>
            </div>
            <Campo etiqueta="Dirección" ayuda="Opcional. Si el cliente no tiene dirección, la ubicación se toma con el GPS en la primera visita.">
              <input className={claseInput} value={f.direccion} onChange={(e) => setF({ ...f, direccion: e.target.value })} placeholder="Calle 5 # 38-20" />
            </Campo>
            <Campo etiqueta="Contacto en el punto">
              <input className={claseInput} value={f.contacto} onChange={(e) => setF({ ...f, contacto: e.target.value })} />
            </Campo>
            <div className="flex justify-end gap-2 pt-2">
              <Boton type="button" variante="fantasma" onClick={() => setNuevo(false)}>
                Cancelar
              </Boton>
              <Boton type="submit">Guardar punto</Boton>
            </div>
          </form>
        </Modal>
      )}
      {importando && (
        <ImportarExcel
          titulo="Cargar clientes desde Excel"
          explicacion="Carga o actualiza clientes y puntos de venta en bloque. La dirección y las coordenadas son opcionales: si faltan, la ubicación se toma en la primera visita."
          llave="el código del cliente. Si el código ya existe, la fila actualiza ese cliente en lugar de crear uno nuevo."
          ejemplo={EJEMPLO_CLIENTES}
          onDescargarPlantilla={() => descargarPlantilla('plantilla-clientes.xlsx', COLUMNAS_CLIENTES, EJEMPLO_CLIENTES.slice(0, 3))}
          revisar={(filas) => revisarClientes(filas, puntos, listas)}
          onConfirmar={(validas) => {
            const r = importarPuntos(validas)
            avisar(`Carga lista: ${r.nuevos} clientes nuevos y ${r.actualizados} actualizados`)
            setImportando(false)
          }}
          onCerrar={() => setImportando(false)}
        />
      )}
    </>
  )
}

function ListasConfig() {
  const { listas, agregarALista, avisar } = useDemo()
  const [borrador, setBorrador] = useState<Partial<Record<keyof Listas, string>>>({})
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {(Object.keys(NOMBRE_LISTA) as (keyof Listas)[]).map((k) => (
        <section key={k} className="rounded-2xl border border-linea bg-white p-5">
          <h2 className="font-semibold">{NOMBRE_LISTA[k]}</h2>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {listas[k].map((x) => (
              <li key={x} className="rounded-lg bg-niebla px-2.5 py-1 text-sm">
                {x}
              </li>
            ))}
          </ul>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const v = borrador[k]?.trim()
              if (!v) return
              agregarALista(k, v)
              setBorrador({ ...borrador, [k]: '' })
              avisar(`“${v}” agregado a ${NOMBRE_LISTA[k].toLowerCase()}`)
            }}
          >
            <input
              className={`${claseInput} py-2 text-sm`}
              placeholder="Agregar opción"
              aria-label={`Agregar opción a ${NOMBRE_LISTA[k]}`}
              value={borrador[k] ?? ''}
              onChange={(e) => setBorrador({ ...borrador, [k]: e.target.value })}
            />
            <Boton type="submit" variante="secundario" className="px-3 py-2" aria-label="Agregar">
              <Plus size={16} />
            </Boton>
          </form>
        </section>
      ))}
    </div>
  )
}
