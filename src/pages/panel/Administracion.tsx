import { FileSpreadsheet, MapPin, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Boton, Campo, claseInput, claseSelect, Modal } from '../../components/ui'
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
  franjas: 'Franjas horarias',
}

function descargarPlantilla() {
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, XLSX.utils.aoa_to_sheet([['Nombre', 'Perfil', 'Zonas', 'Teléfono']]), 'Usuarios')
  XLSX.utils.book_append_sheet(libro, XLSX.utils.aoa_to_sheet([['Nombre', 'Canal', 'Zona', 'Dirección', 'Contacto', 'Latitud', 'Longitud']]), 'Puntos de venta')
  XLSX.writeFile(libro, 'plantilla-carga-inicial.xlsx')
}

export function Administracion() {
  const [pestaña, setPestaña] = useState<Pestaña>('usuarios')
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Administración</h1>
          <p className="mt-1 text-gris">La información base de la operación, mantenida por la compañía.</p>
        </div>
        <Boton variante="secundario" onClick={descargarPlantilla}>
          <FileSpreadsheet size={17} aria-hidden /> Descargar plantilla de carga
        </Boton>
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
        <div className="flex gap-2">
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
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-linea text-left text-xs text-gris">
            <tr>
              <th className="px-5 py-3 font-medium">Nombre</th>
              <th className="py-3 font-medium">Perfil</th>
              <th className="py-3 font-medium">Zonas</th>
              <th className="py-3 font-medium">Teléfono</th>
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
  const { puntos, listas, agregarPunto, avisar } = useDemo()
  const [zona, setZona] = useState('')
  const [nuevo, setNuevo] = useState(false)
  const [f, setF] = useState({ nombre: '', canal: listas.canales[0], zona: listas.zonas[0], direccion: '', contacto: '' })
  const lista = puntos.filter((p) => !zona || p.zona === zona)
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select aria-label="Zona" className={claseSelect} value={zona} onChange={(e) => setZona(e.target.value)}>
          <option value="">Todas las zonas ({puntos.length} puntos)</option>
          {listas.zonas.map((z) => (
            <option key={z}>{z}</option>
          ))}
        </select>
        <Boton onClick={() => setNuevo(true)}>
          <Plus size={17} aria-hidden /> Agregar punto de venta
        </Boton>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-linea bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-linea text-left text-xs text-gris">
            <tr>
              <th className="px-5 py-3 font-medium">Punto de venta</th>
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
                <td className="px-5 py-2.5 font-medium">{p.nombre}</td>
                <td className="py-2.5">{p.canal}</td>
                <td className="py-2.5">{p.zona}</td>
                <td className="py-2.5 text-gris">{p.direccion}</td>
                <td className="py-2.5">{p.contacto}</td>
                <td className="px-5 py-2.5 text-xs text-gris tabular">
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={13} aria-hidden />
                    {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                  </span>
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
              const base = puntos.find((p) => p.zona === f.zona)!
              agregarPunto({ ...f, nombre: f.nombre.trim(), lat: base.lat + 0.004, lng: base.lng - 0.003, contacto: f.contacto || '—' })
              avisar(`${f.nombre} quedó disponible para planificar visitas`)
              setNuevo(false)
            }}
          >
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
            <Campo etiqueta="Dirección" ayuda="Si no se conocen las coordenadas, se toman en la primera visita registrada.">
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
