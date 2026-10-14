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
  /** Código del cliente: llave para la carga por Excel sin duplicados */
  codigo: string
  nombre: string
  canal: string
  zona: string
  /** Puede venir vacío: hay clientes sin dirección completa en la base de datos */
  direccion: string
  contacto: string
  /** Sin coordenadas hasta la primera visita, que las toma con el GPS */
  lat?: number
  lng?: number
  ubicacionOrigen: 'base' | 'visita' | 'pendiente'
  ubicacionFecha?: string
}

export interface Faltante {
  producto: string
  cantidad: number
}

export interface NovedadPosterior {
  id: string
  fecha: string
  hora: string
  autor: string
  motivo: string
  detalle: string
}

export type Estado = 'programada' | 'realizada' | 'no_realizada' | 'reprogramada'

export const ESTADO_NOMBRE: Record<Estado, string> = {
  programada: 'Programada',
  realizada: 'Realizada',
  no_realizada: 'No realizada',
  reprogramada: 'Reprogramada',
}

export type EstadoCartera = 'Al día' | 'Vencida'

export interface GestionVendedora {
  gestion: string
  /** Descripción cuando la gestión es "Otros" */
  gestionOtro?: string
  estimadoPedido: number
  unidadesPedido: number
  motivoNoVenta?: string
  estadoCartera: EstadoCartera
  faltantes: Faltante[]
  seguimiento: string
  novedades: string
  proximaAccion: string
  fechaCompromiso?: string
  compromisoCumplido?: boolean
}

export interface GestionImpulsadora {
  asistencia: boolean
  faltantes: Faltante[]
  unidades: number
  exhibicion: 'Buena' | 'Regular' | 'Deficiente'
  pop: boolean
  popObservaciones: string
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
  /** Vendedora: foto de inicio de jornada (solo en la primera visita del día). Impulsadora: foto de llegada al almacén. */
  foto?: string // dataURL de una foto tomada en la demo
  fotoSemilla?: number // foto ilustrada de demostración
  /** Impulsadora: foto de la exhibición de los productos */
  fotoExhibicion?: string
  fotoExhibicionSemilla?: number
  /** La visita tomó la ubicación de un cliente que no la tenía */
  ubicacionTomada?: boolean
  motivoNoRealizacion?: string
  motivoNoProgramada?: string
  reprogramadaPara?: string
  origenId?: string
  historial: string[]
  vendedora?: GestionVendedora
  impulsadora?: GestionImpulsadora
  /** Novedades registradas después de cerrar la visita; el registro original no cambia */
  novedadesPosteriores: NovedadPosterior[]
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
  gestiones: string[]
  motivosNovedad: string[]
  franjas: string[]
}
