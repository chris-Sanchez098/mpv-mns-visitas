export type Perfil = 'impulsadora' | 'vendedora' | 'supervision' | 'administracion' | 'direccion'

export const PERFIL_NOMBRE: Record<Perfil, string> = {
  impulsadora: 'Impulsadora',
  vendedora: 'Vendedora comercial',
  supervision: 'Supervisión',
  administracion: 'Administración',
  direccion: 'Dirección Comercial',
}

export interface Usuario {
  id: string
  nombre: string
  perfil: Perfil
  zonas: string[]
  telefono: string
  activo: boolean
}

export interface Punto {
  id: string
  nombre: string
  canal: string
  zona: string
  direccion: string
  contacto: string
  lat: number
  lng: number
}

export type Estado = 'programada' | 'realizada' | 'no_realizada' | 'reprogramada'

export const ESTADO_NOMBRE: Record<Estado, string> = {
  programada: 'Programada',
  realizada: 'Realizada',
  no_realizada: 'No realizada',
  reprogramada: 'Reprogramada',
}

export interface GestionVendedora {
  gestion: string
  valorPedido: number
  recaudo: number
  motivoNoVenta?: string
  seguimiento: string
  novedades: string
  proximaAccion: string
  fechaCompromiso?: string
  compromisoCumplido?: boolean
}

export interface GestionImpulsadora {
  asistencia: boolean
  agotados: string[]
  unidades: number
  exhibicion: 'Buena' | 'Regular' | 'Deficiente'
  pop: boolean
  promociones: string
  actividades: string[]
  competencia: string
  oportunidades: string
  novedades: string
}

export interface Visita {
  id: string
  usuarioId: string
  puntoId: string
  fecha: string // YYYY-MM-DD
  orden: number
  franja: string
  tipo: string
  objetivo: string
  impacto: string
  programada: boolean
  estado: Estado
  llegada?: string
  salida?: string
  distanciaM?: number
  enRango?: boolean
  foto?: string // dataURL de una foto tomada en la demo
  fotoSemilla?: number // foto ilustrada de demostración
  motivoNoRealizacion?: string
  motivoNoProgramada?: string
  reprogramadaPara?: string
  origenId?: string
  historial: string[]
  vendedora?: GestionVendedora
  impulsadora?: GestionImpulsadora
  sync: 'sincronizada' | 'pendiente'
}

export interface Listas {
  zonas: string[]
  canales: string[]
  tiposVisita: string[]
  objetivos: string[]
  motivosNoVenta: string[]
  motivosNoRealizacion: string[]
  productos: string[]
  actividades: string[]
  franjas: string[]
}
