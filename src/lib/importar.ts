import * as XLSX from 'xlsx'
import type { Listas, Punto, Usuario, Visita } from '../data/types'
import { iso } from './fechas'

export type Fila = Record<string, unknown>

export interface Revision<T> {
  validas: T[]
  nuevas: number
  actualizadas: number
  errores: { fila: number; mensaje: string }[]
}

export const COLUMNAS_CLIENTES = ['Código', 'Nombre', 'Canal', 'Zona', 'Dirección', 'Contacto', 'Latitud', 'Longitud']
export const COLUMNAS_PLAN = ['Fecha', 'Persona', 'Código cliente', 'Orden', 'Franja', 'Tipo de visita', 'Objetivo', 'Impacto esperado']

const txt = (x: unknown) => (x === undefined || x === null ? '' : String(x).trim())
const num = (x: unknown) => {
  const n = Number(String(x ?? '').replace(',', '.'))
  return txt(x) === '' || Number.isNaN(n) ? undefined : n
}

export async function leerExcel(archivo: File): Promise<Fila[]> {
  const libro = XLSX.read(await archivo.arrayBuffer(), { cellDates: true })
  return XLSX.utils.sheet_to_json<Fila>(libro.Sheets[libro.SheetNames[0]], { defval: '' })
}

export function descargarPlantilla(nombre: string, columnas: string[], ejemplo: Fila[]) {
  const hoja = XLSX.utils.json_to_sheet(ejemplo, { header: columnas })
  hoja['!cols'] = columnas.map((c) => ({ wch: Math.max(14, c.length + 4) }))
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Datos')
  XLSX.writeFile(libro, nombre)
}

/** Clientes: el código es la llave. Si ya existe se actualiza, si no se crea. */
export function revisarClientes(filas: Fila[], puntos: Punto[], listas: Listas): Revision<Omit<Punto, 'id'>> {
  const r: Revision<Omit<Punto, 'id'>> = { validas: [], nuevas: 0, actualizadas: 0, errores: [] }
  const vistos = new Set<string>()
  filas.forEach((f, i) => {
    const fila = i + 2 // la fila 1 son los encabezados
    const codigo = txt(f['Código'])
    const nombre = txt(f['Nombre'])
    const zona = txt(f['Zona'])
    const canal = txt(f['Canal'])
    if (!codigo || !nombre) return r.errores.push({ fila, mensaje: 'Faltan el código o el nombre del cliente' })
    if (vistos.has(codigo.toLowerCase())) return r.errores.push({ fila, mensaje: `El código ${codigo} está repetido en el archivo` })
    if (!listas.zonas.includes(zona)) return r.errores.push({ fila, mensaje: `La zona "${zona}" no existe en las listas` })
    if (canal && !listas.canales.includes(canal)) return r.errores.push({ fila, mensaje: `El canal "${canal}" no existe en las listas` })
    vistos.add(codigo.toLowerCase())
    const lat = num(f['Latitud'])
    const lng = num(f['Longitud'])
    const existe = puntos.some((p) => p.codigo.toLowerCase() === codigo.toLowerCase())
    if (existe) r.actualizadas++
    else r.nuevas++
    r.validas.push({
      codigo,
      nombre,
      canal: canal || listas.canales[0],
      zona,
      direccion: txt(f['Dirección']),
      contacto: txt(f['Contacto']) || '—',
      lat,
      lng,
      ubicacionOrigen: lat !== undefined && lng !== undefined ? 'base' : 'pendiente',
    })
  })
  return r
}

function fechaDe(x: unknown): string | undefined {
  if (x instanceof Date && !Number.isNaN(x.getTime())) return iso(x)
  const s = txt(x)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/) // dd/mm/aaaa
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return undefined
}

type FilaPlan = Omit<Visita, 'id' | 'historial' | 'sync' | 'estado' | 'programada' | 'novedadesPosteriores'>

/** Programación: persona + cliente + fecha identifican la visita. Si ya está en el plan se actualiza. */
export function revisarPlan(filas: Fila[], usuarios: Usuario[], puntos: Punto[], visitas: Visita[], listas: Listas): Revision<FilaPlan> {
  const r: Revision<FilaPlan> = { validas: [], nuevas: 0, actualizadas: 0, errores: [] }
  const vistos = new Set<string>()
  const campo = usuarios.filter((u) => u.perfil === 'impulsadora' || u.perfil === 'vendedora')
  filas.forEach((f, i) => {
    const fila = i + 2
    const fecha = fechaDe(f['Fecha'])
    const persona = txt(f['Persona'])
    const codigo = txt(f['Código cliente'])
    if (!fecha) return r.errores.push({ fila, mensaje: 'La fecha no es válida (usa aaaa-mm-dd o dd/mm/aaaa)' })
    const u = campo.find((x) => x.nombre.toLowerCase() === persona.toLowerCase())
    if (!u) return r.errores.push({ fila, mensaje: `"${persona}" no es una impulsadora o vendedora registrada` })
    const p = puntos.find((x) => x.codigo.toLowerCase() === codigo.toLowerCase())
    if (!p) return r.errores.push({ fila, mensaje: `El cliente ${codigo || '(vacío)'} no existe. Cárgalo primero en clientes` })
    const llave = `${u.id}|${p.id}|${fecha}`
    if (vistos.has(llave)) return r.errores.push({ fila, mensaje: `${u.nombre} ya tiene a ${p.nombre} el ${fecha} en otra fila del archivo` })
    vistos.add(llave)
    const existe = visitas.some((v) => v.programada && v.usuarioId === u.id && v.puntoId === p.id && v.fecha === fecha)
    if (existe) r.actualizadas++
    else r.nuevas++
    r.validas.push({
      usuarioId: u.id,
      puntoId: p.id,
      fecha,
      orden: num(f['Orden']) ?? 1,
      franja: txt(f['Franja']) || listas.franjas[0],
      tipo: txt(f['Tipo de visita']) || (u.perfil === 'vendedora' ? 'Toma de pedido' : 'Impulso y asesoría'),
      objetivo: txt(f['Objetivo']) || listas.objetivos[0],
      impacto: txt(f['Impacto esperado']) || '—',
    })
  })
  return r
}
