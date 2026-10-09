import { diasHabiles, hoyDemo } from '../lib/fechas'
import type { Listas, Punto, Usuario, Visita, Estado } from './types'

/** Generador pseudoaleatorio con semilla: la demo siempre arranca igual. */
function crearAzar(semilla: number) {
  let s = semilla
  const r = () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
  return {
    r,
    entre: (a: number, b: number) => Math.floor(a + r() * (b - a + 1)),
    uno: <T,>(xs: T[]): T => xs[Math.floor(r() * xs.length)],
    varios: <T,>(xs: T[], n: number): T[] => [...xs].sort(() => r() - 0.5).slice(0, n),
  }
}

export const LISTAS_INICIALES: Listas = {
  zonas: ['Cali Norte', 'Cali Sur', 'Cali Oeste', 'Palmira', 'Jamundí', 'Yumbo'],
  canales: ['Droguería', 'Tienda naturista', 'Supermercado', 'Farmacia de cadena'],
  tiposVisita: ['Toma de pedido', 'Seguimiento', 'Cobro de cartera', 'Impulso y asesoría', 'Lanzamiento de producto', 'Apertura de cliente'],
  objetivos: [
    'Tomar pedido de reposición',
    'Recuperar cartera vencida',
    'Presentar Colágeno + Vitamina C',
    'Negociar espacio en góndola',
    'Asesorar en punto de venta',
    'Verificar exhibición y precios',
  ],
  motivosNoVenta: ['Inventario suficiente', 'Sin presupuesto este mes', 'Encargado de compras ausente', 'Precio frente a la competencia', 'Pedido pendiente por entregar'],
  motivosNoRealizacion: ['Punto de venta cerrado', 'Encargado no disponible', 'El cliente canceló la visita', 'Problema de transporte', 'Tiempo insuficiente en la ruta', 'Calamidad o incapacidad'],
  productos: [
    'Magnesio',
    'Colágeno + Vitamina C',
    'Omega 3',
    'Ginkgo Biloba',
    'Melatonina',
    'L-Carnitina',
    'Probióticos',
    'Shampoo de Silicio Orgánico',
    'Vitamina C 1000',
    'Complejo B',
  ],
  actividades: ['Asesoría a compradores', 'Organización de góndola', 'Conteo de inventario', 'Activación de marca', 'Instalación de material POP', 'Degustación de producto'],
  franjas: ['8:00 – 10:00', '10:00 – 12:00', '14:00 – 16:00', '16:00 – 18:00'],
}

const ZONAS: Record<string, { lat: number; lng: number; barrios: string[] }> = {
  'Cali Norte': { lat: 3.472, lng: -76.523, barrios: ['Chipichape', 'La Flora', 'Vipasa', 'Los Andes', 'Prados del Norte', 'Santa Mónica', 'Versalles', 'Granada'] },
  'Cali Sur': { lat: 3.378, lng: -76.535, barrios: ['Ciudad Jardín', 'El Ingenio', 'Valle del Lili', 'Pance', 'Capri', 'Meléndez', 'El Caney', 'Limonar'] },
  'Cali Oeste': { lat: 3.446, lng: -76.548, barrios: ['San Antonio', 'El Peñón', 'Santa Teresita', 'Normandía', 'Bellavista', 'Arboleda', 'Centenario', 'Juanambú'] },
  Palmira: { lat: 3.536, lng: -76.299, barrios: ['Centro', 'Zamorano', 'La Emilia', 'Bizerta', 'Mirriñao', 'Las Mercedes', 'Santa Bárbara', 'Coronado'] },
  Jamundí: { lat: 3.262, lng: -76.538, barrios: ['Centro', 'Alfaguara', 'Terranova', 'Ciudad Sur', 'El Rosario', 'Potrerito', 'Bonanza', 'Las Acacias'] },
  Yumbo: { lat: 3.583, lng: -76.494, barrios: ['Centro', 'Las Américas', 'Panorama', 'Bellavista', 'Puerto Isaacs', 'Guacandá', 'Lleras', 'Fray Peña'] },
}

const NOMBRE_CANAL: Record<string, string[]> = {
  Droguería: ['Droguería', 'Droguería Salud', 'Droguería Familiar'],
  'Tienda naturista': ['Naturista Vida Sana', 'Tienda Natural', 'Naturista El Trébol'],
  Supermercado: ['Supermercado', 'Autoservicio', 'Mercado'],
  'Farmacia de cadena': ['Farmacia Bienestar', 'Farmacia Central', 'Farmacia Popular'],
}

const CONTACTOS = ['Gloria Patiño', 'Hernán Sierra', 'Luz Dary Cortés', 'Fabio Lozano', 'Beatriz Gil', 'Óscar Mena', 'Rosa Elena Díaz', 'Jairo Ruiz']

const IMPULSADORAS = [
  'Laura Gómez', 'Paola Castillo', 'Andrea Moreno', 'Valentina Rojas', 'Juliana Vargas', 'Marcela Torres',
  'Daniela Cárdenas', 'Sandra Muñoz', 'Lina Quintero', 'Viviana Ríos', 'Catalina Zapata', 'Yuliana Rendón',
  'Angie Salazar', 'Estefanía Duque', 'Mónica Arango', 'Tatiana Ocampo', 'Claudia Benítez', 'Leidy Hurtado',
]
const VENDEDORAS = ['Diana Restrepo', 'Carolina Mejía', 'Natalia Ospina']

/** Usuarios con los que se recorre la demo. */
export const DEMO = {
  impulsadora: 'u-imp-1',
  vendedora: 'u-ven-1',
  supervision: 'u-sup-1',
  administracion: 'u-adm-1',
  direccion: 'u-dir-1',
}

export interface DatosDemo {
  generadoPara: string
  usuarios: Usuario[]
  puntos: Punto[]
  visitas: Visita[]
  listas: Listas
}

export function generarDatos(): DatosDemo {
  const a = crearAzar(1999) // año de fundación de Millenium
  const hoy = hoyDemo()
  const dias = diasHabiles(hoy, 6)
  const zonas = LISTAS_INICIALES.zonas
  const tel = () => `31${a.entre(0, 9)} ${a.entre(100, 999)} ${a.entre(1000, 9999)}`

  // Puntos de venta: 8 por zona
  const puntos: Punto[] = []
  zonas.forEach((zona, zi) => {
    const z = ZONAS[zona]
    z.barrios.forEach((barrio, bi) => {
      const canal = LISTAS_INICIALES.canales[(bi + zi) % 4]
      puntos.push({
        id: `p-${zi}-${bi}`,
        nombre: `${a.uno(NOMBRE_CANAL[canal])} ${barrio}`,
        canal,
        zona,
        direccion: `${a.uno(['Calle', 'Carrera', 'Avenida'])} ${a.entre(1, 80)} # ${a.entre(1, 99)}-${a.entre(10, 99)}`,
        contacto: a.uno(CONTACTOS),
        lat: z.lat + (a.r() - 0.5) * 0.035,
        lng: z.lng + (a.r() - 0.5) * 0.035,
      })
    })
  })

  // Usuarios
  const usuarios: Usuario[] = [
    ...IMPULSADORAS.map((nombre, i) => ({
      id: `u-imp-${i + 1}`,
      nombre,
      perfil: 'impulsadora' as const,
      zonas: [zonas[i % 6]],
      telefono: tel(),
      activo: true,
    })),
    ...VENDEDORAS.map((nombre, i) => ({
      id: `u-ven-${i + 1}`,
      nombre,
      perfil: 'vendedora' as const,
      zonas: [zonas[i * 2], zonas[i * 2 + 1]],
      telefono: tel(),
      activo: true,
    })),
    { id: 'u-sup-1', nombre: 'Jorge Caicedo', perfil: 'supervision', zonas: [...zonas], telefono: tel(), activo: true },
    { id: 'u-adm-1', nombre: 'Martha Lucía Vélez', perfil: 'administracion', zonas: [...zonas], telefono: tel(), activo: true },
    { id: 'u-dir-1', nombre: 'Ana María Holguín', perfil: 'direccion', zonas: [...zonas], telefono: tel(), activo: true },
  ]

  // Cumplimiento base por persona: dos personas quedan por debajo de la meta para mostrar desviaciones.
  const sesgo: Record<string, number> = { 'u-imp-16': 0.52, 'u-ven-2': 0.64, 'u-imp-9': 0.7 }

  const visitas: Visita[] = []
  let n = 0
  const L = LISTAS_INICIALES

  for (const u of usuarios.filter((x) => x.perfil === 'impulsadora' || x.perfil === 'vendedora')) {
    const esVen = u.perfil === 'vendedora'
    const misPuntos = puntos.filter((p) => u.zonas.includes(p.zona))
    const exito = sesgo[u.id] ?? 0.88
    const esDemo = u.id === DEMO.impulsadora || u.id === DEMO.vendedora

    dias.forEach((fecha) => {
      const esHoy = fecha === hoy
      const cantidad = esVen ? a.entre(5, 6) : a.entre(3, 4)
      const elegidos = a.varios(misPuntos, cantidad)
      // Hoy: la mitad de la ruta ya se hizo, salvo para los usuarios de la demo, que la recorren en vivo.
      const hechasHoy = esDemo ? 0 : Math.floor(cantidad / 2)

      elegidos.forEach((p, i) => {
        const inicio = 8 * 60 + i * (esVen ? 75 : 120) + a.entre(0, 20)
        const fr = L.franjas[Math.min(3, Math.floor((inicio - 480) / 120))]
        const tipo = esVen ? a.uno(['Toma de pedido', 'Seguimiento', 'Cobro de cartera', 'Lanzamiento de producto']) : 'Impulso y asesoría'
        const objetivo = esVen ? a.uno(L.objetivos.slice(0, 4)) : a.uno(L.objetivos.slice(3))
        const impacto = esVen
          ? `Pedido estimado ${(a.entre(8, 40) * 100_000).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}`
          : a.uno(['Rotación +15 % en la semana', 'Exhibición en primer nivel', 'Cero agotados en Magnesio', 'Visibilidad del lanzamiento'])

        let estado: Estado = 'programada'
        if (!esHoy || i < hechasHoy) {
          const x = a.r()
          estado = x < exito ? 'realizada' : x < exito + (1 - exito) * 0.6 ? 'no_realizada' : 'reprogramada'
        }

        const v: Visita = {
          id: `v-${++n}`,
          usuarioId: u.id,
          puntoId: p.id,
          fecha,
          orden: i + 1,
          franja: fr,
          tipo,
          objetivo,
          impacto,
          programada: true,
          estado,
          historial: [`Plan publicado por Jorge Caicedo`],
          sync: 'sincronizada',
        }
        if (estado === 'realizada') completar(v, esVen, inicio)
        if (estado === 'no_realizada') v.motivoNoRealizacion = a.uno(L.motivosNoRealizacion)
        if (estado === 'reprogramada') {
          v.historial.push('Reprogramada por supervisión')
          v.reprogramadaPara = fecha === hoy ? undefined : dias[dias.indexOf(fecha) + 1]
        }
        visitas.push(v)
      })

      // Visitas no programadas: gestión adicional
      if (!esDemo && (!esHoy || a.r() < 0.3) && a.r() < 0.35) {
        const p = a.uno(misPuntos)
        const v: Visita = {
          id: `v-${++n}`,
          usuarioId: u.id,
          puntoId: p.id,
          fecha,
          orden: 99,
          franja: '—',
          tipo: esVen ? 'Toma de pedido' : 'Impulso y asesoría',
          objetivo: 'Oportunidad detectada en ruta',
          impacto: '—',
          programada: false,
          estado: 'realizada',
          motivoNoProgramada: a.uno(['El cliente llamó a pedir producto', 'Punto cercano a la ruta', 'Reposición urgente por agotado']),
          historial: ['Registrada en campo como no programada'],
          sync: 'sincronizada',
        }
        completar(v, esVen, 15 * 60 + a.entre(0, 90))
        visitas.push(v)
      }
    })
  }

  function completar(v: Visita, esVen: boolean, inicioMin: number) {
    const dur = a.entre(25, 55)
    const hh = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
    v.llegada = hh(inicioMin)
    v.salida = hh(inicioMin + dur)
    const fuera = a.r() < 0.07
    v.enRango = !fuera
    v.distanciaM = fuera ? a.entre(380, 1600) : a.entre(6, 110)
    v.fotoSemilla = a.entre(1, 9999)
    if (esVen) {
      const vende = a.r() < 0.78
      v.vendedora = {
        gestion: v.tipo,
        valorPedido: vende ? a.entre(4, 45) * 100_000 : 0,
        recaudo: a.r() < 0.7 ? a.entre(2, 30) * 100_000 : 0,
        motivoNoVenta: vende ? undefined : a.uno(L.motivosNoVenta),
        seguimiento: a.uno(['Se confirmó la entrega del pedido anterior', 'Compromiso de pago cumplido', 'Pendiente respuesta de compras', 'Sin compromisos anteriores']),
        novedades: a.uno(['Sin novedades', 'Solicitan material POP para la vitrina', 'Competencia con descuento del 20 % en colágeno', 'Cambio de administrador del punto']),
        proximaAccion: a.uno(['Llamar para confirmar pedido', 'Enviar lista de precios actualizada', 'Volver con muestras de Melatonina', 'Cobrar factura pendiente', 'Coordinar exhibición en cabecera']),
      }
      const d = diasHabiles(hoy, 10)
      v.vendedora.fechaCompromiso = d[a.entre(3, 9)]
      v.vendedora.compromisoCumplido = v.vendedora.fechaCompromiso < hoy ? a.r() < 0.88 : false
    } else {
      v.impulsadora = {
        asistencia: true,
        agotados: a.r() < 0.4 ? a.varios(L.productos, a.entre(1, 2)) : [],
        unidades: a.entre(3, 38),
        exhibicion: a.uno(['Buena', 'Buena', 'Regular', 'Deficiente'] as const),
        pop: a.r() < 0.7,
        promociones: a.uno(['Sin promoción activa', 'Lleve 2 Magnesio con 15 % de descuento', 'Omega 3 + Vitamina C de obsequio']),
        actividades: a.varios(L.actividades, a.entre(1, 3)),
        competencia: a.uno(['Sin novedad', 'Marca competidora con impulsadora los fines de semana', 'Competencia bajó precio del colágeno', 'Nueva marca de magnesio en góndola']),
        oportunidades: a.uno(['Ninguna', 'Espacio libre en cabecera', 'Clientes preguntan por presentación grande', 'El punto quiere ampliar el surtido de capilares']),
        novedades: a.uno(['Sin novedades', 'Producto con fecha corta en bodega', 'Faltan precios en la góndola']),
      }
    }
  }

  return { generadoPara: hoy, usuarios, puntos, visitas, listas: L }
}
