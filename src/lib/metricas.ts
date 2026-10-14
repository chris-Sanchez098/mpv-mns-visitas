import type { Perfil, Usuario, Visita } from '../data/types'

export const META_CUMPLIMIENTO = 0.85

export interface Filtros {
  dias: string[]
  zona: string
  perfil: '' | Perfil
  usuarioId: string
}

/** Solo cuenta lo que ya llegó al servidor: lo pendiente por sincronizar aún no se ve en el panel. */
export function filtrar(visitas: Visita[], usuarios: Usuario[], puntosZona: Map<string, string>, f: Filtros): Visita[] {
  const perfil = new Map(usuarios.map((u) => [u.id, u.perfil]))
  return visitas.filter(
    (v) =>
      v.sync === 'sincronizada' &&
      f.dias.includes(v.fecha) &&
      (!f.zona || puntosZona.get(v.puntoId) === f.zona) &&
      (!f.perfil || perfil.get(v.usuarioId) === f.perfil) &&
      (!f.usuarioId || v.usuarioId === f.usuarioId),
  )
}

export function indicadores(vs: Visita[]) {
  const plan = vs.filter((v) => v.programada)
  const realizadas = plan.filter((v) => v.estado === 'realizada').length
  const noRealizadas = plan.filter((v) => v.estado === 'no_realizada').length
  const reprogramadas = plan.filter((v) => v.estado === 'reprogramada').length
  const porVisitar = plan.filter((v) => v.estado === 'programada').length
  const cerradas = plan.length - porVisitar
  const adicionales = vs.filter((v) => !v.programada && v.estado === 'realizada')
  const hechas = vs.filter((v) => v.estado === 'realizada')
  const ven = hechas.filter((v) => v.vendedora)
  const imp = hechas.filter((v) => v.impulsadora)
  return {
    programadas: plan.length,
    realizadas,
    noRealizadas,
    reprogramadas,
    porVisitar,
    cumplimiento: cerradas ? realizadas / cerradas : 0,
    avance: plan.length ? realizadas / plan.length : 0,
    adicionales: adicionales.length,
    fueraDeRango: hechas.filter((v) => v.enRango === false).length,
    pedidos: ven.reduce((s, v) => s + (v.vendedora?.estimadoPedido ?? 0), 0),
    unidadesPedido: ven.reduce((s, v) => s + (v.vendedora?.unidadesPedido ?? 0), 0),
    carteraVencida: new Set(ven.filter((v) => v.vendedora?.estadoCartera === 'Vencida').map((v) => v.puntoId)).size,
    clientesVisitados: new Set(ven.map((v) => v.puntoId)).size,
    efectividadVenta: ven.length ? ven.filter((v) => (v.vendedora?.estimadoPedido ?? 0) > 0).length / ven.length : 0,
    unidades: imp.reduce((s, v) => s + (v.impulsadora?.unidades ?? 0), 0),
    faltantes: hechas.reduce((s, v) => s + faltantesDe(v).length, 0),
    novedadesPosteriores: vs.reduce((s, v) => s + v.novedadesPosteriores.length, 0),
    exhibicionDeficiente: imp.filter((v) => v.impulsadora?.exhibicion === 'Deficiente').length,
  }
}

export function porc(x: number): string {
  return `${Math.round(x * 100)} %`
}

export function faltantesDe(v: Visita) {
  return v.vendedora?.faltantes ?? v.impulsadora?.faltantes ?? []
}

/** Referencias faltantes del periodo, sumando cantidades, de mayor a menor */
export function resumenFaltantes(vs: Visita[]) {
  const m = new Map<string, { cantidad: number; puntos: Set<string> }>()
  vs.filter((v) => v.estado === 'realizada').forEach((v) =>
    faltantesDe(v).forEach((f) => {
      const x = m.get(f.producto) ?? { cantidad: 0, puntos: new Set<string>() }
      x.cantidad += f.cantidad
      x.puntos.add(v.puntoId)
      m.set(f.producto, x)
    }),
  )
  return [...m.entries()].map(([producto, x]) => ({ producto, cantidad: x.cantidad, puntos: x.puntos.size })).sort((a, b) => b.cantidad - a.cantidad)
}

/** Cuántas veces se registró cada actividad (impulsadoras) o gestión (vendedoras) */
export function resumenActividades(vs: Visita[]) {
  const m = new Map<string, number>()
  vs.filter((v) => v.estado === 'realizada').forEach((v) => {
    const xs = v.impulsadora ? v.impulsadora.actividades : v.vendedora ? [v.vendedora.gestion] : []
    xs.forEach((x) => m.set(x, (m.get(x) ?? 0) + 1))
  })
  return [...m.entries()].map(([nombre, n]) => ({ nombre, n })).sort((a, b) => b.n - a.n)
}
