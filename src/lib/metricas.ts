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
    pedidos: ven.reduce((s, v) => s + (v.vendedora?.valorPedido ?? 0), 0),
    recaudo: ven.reduce((s, v) => s + (v.vendedora?.recaudo ?? 0), 0),
    efectividadVenta: ven.length ? ven.filter((v) => (v.vendedora?.valorPedido ?? 0) > 0).length / ven.length : 0,
    unidades: imp.reduce((s, v) => s + (v.impulsadora?.unidades ?? 0), 0),
    agotados: imp.reduce((s, v) => s + (v.impulsadora?.agotados.length ?? 0), 0),
    exhibicionDeficiente: imp.filter((v) => v.impulsadora?.exhibicion === 'Deficiente').length,
  }
}

export function porc(x: number): string {
  return `${Math.round(x * 100)} %`
}
