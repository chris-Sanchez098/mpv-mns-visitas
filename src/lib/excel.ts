import * as XLSX from 'xlsx'
import { faltantesDe } from './metricas'
import { ESTADO_NOMBRE, PERFIL_NOMBRE, type Punto, type Usuario, type Visita } from '../data/types'

export function exportarVisitas(visitas: Visita[], usuarios: Usuario[], puntos: Punto[], nombre: string) {
  const u = new Map(usuarios.map((x) => [x.id, x]))
  const p = new Map(puntos.map((x) => [x.id, x]))
  const filas = visitas.map((v) => {
    const us = u.get(v.usuarioId)
    const pt = p.get(v.puntoId)
    return {
      Fecha: v.fecha,
      Persona: us?.nombre,
      Perfil: us ? PERFIL_NOMBRE[us.perfil] : '',
      Zona: pt?.zona,
      'Punto de venta': pt?.nombre,
      Programada: v.programada ? 'Sí' : 'No',
      Orden: v.programada ? v.orden : '',
      Tipo: v.tipo,
      Objetivo: v.objetivo,
      Estado: ESTADO_NOMBRE[v.estado],
      Llegada: v.llegada ?? '',
      Salida: v.salida ?? '',
      'Distancia al punto (m)': v.distanciaM ?? '',
      'En rango': v.enRango === undefined ? '' : v.enRango ? 'Sí' : 'No',
      'Código cliente': pt?.codigo,
      'Gestión': v.vendedora ? (v.vendedora.gestion === 'Otros' ? `Otros: ${v.vendedora.gestionOtro ?? ''}` : v.vendedora.gestion) : v.impulsadora?.actividades.join(', ') ?? '',
      'Estimado de pedido': v.vendedora?.estimadoPedido ?? '',
      'Unidades del pedido': v.vendedora?.unidadesPedido ?? '',
      'Estado de cartera': v.vendedora?.estadoCartera ?? '',
      'Motivo de no venta': v.vendedora?.motivoNoVenta ?? '',
      'Unidades vendidas (impulso)': v.impulsadora?.unidades ?? '',
      Faltantes: faltantesDe(v).map((f) => `${f.producto} (${f.cantidad})`).join(', '),
      Exhibición: v.impulsadora?.exhibicion ?? '',
      'Observaciones POP': v.impulsadora?.popObservaciones ?? '',
      'Novedades posteriores': v.novedadesPosteriores.map((n) => `${n.fecha} ${n.motivo}: ${n.detalle}`).join(' | '),
      'Motivo de no realización': v.motivoNoRealizacion ?? '',
      'Próxima acción': v.vendedora?.proximaAccion ?? '',
    }
  })
  const hoja = XLSX.utils.json_to_sheet(filas)
  hoja['!cols'] = Object.keys(filas[0] ?? {}).map((k) => ({ wch: Math.max(10, k.length + 2) }))
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Visitas')
  XLSX.writeFile(libro, `${nombre}.xlsx`)
}
