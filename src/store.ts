import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { generarDatos, ZONAS, type DatosDemo } from './data/mock'
import type { GestionImpulsadora, GestionVendedora, NovedadPosterior, Punto, Usuario, Visita } from './data/types'
import { horaActual, hoyDemo, siguienteHabil } from './lib/fechas'

interface Aviso {
  id: number
  texto: string
}

interface Estado extends DatosDemo {
  sesion: string | null
  enLinea: boolean
  sincronizando: boolean
  planPublicado: Record<string, boolean>
  avisos: Aviso[]

  iniciar: (usuarioId: string) => void
  salir: () => void
  reiniciar: () => void
  avisar: (texto: string) => void
  cerrarAviso: (id: number) => void

  agregarUsuario: (u: Omit<Usuario, 'id'>) => void
  agregarPunto: (p: Omit<Punto, 'id'>) => void
  importarPuntos: (filas: Omit<Punto, 'id'>[]) => { nuevos: number; actualizados: number }
  importarPlan: (filas: Omit<Visita, 'id' | 'historial' | 'sync' | 'estado' | 'programada' | 'novedadesPosteriores'>[]) => { nuevas: number; actualizadas: number }
  agregarALista: (lista: keyof DatosDemo['listas'], valor: string) => void

  agregarVisitaPlan: (v: Omit<Visita, 'id' | 'historial' | 'sync' | 'estado' | 'programada' | 'novedadesPosteriores'>) => void
  publicarPlan: (fecha: string) => void
  reprogramar: (id: string, nuevaFecha: string) => void

  registrarLlegada: (id: string, datos: { hora: string; distanciaM: number; enRango: boolean }) => void
  guardarFoto: (id: string, foto: string, tipo: 'presencia' | 'exhibicion') => void
  usarFotoDemo: (id: string, tipo: 'presencia' | 'exhibicion') => void
  agregarNovedad: (visitaId: string, n: Pick<NovedadPosterior, 'motivo' | 'detalle' | 'autor'>) => void
  finalizarVisita: (id: string, hora: string, gestion: { vendedora?: GestionVendedora; impulsadora?: GestionImpulsadora }) => void
  marcarNoRealizada: (id: string, motivo: string) => void
  crearNoProgramada: (usuarioId: string, puntoId: string, motivo: string) => string
  cambiarConexion: (enLinea: boolean) => void
}

const estadoInicial = () => ({
  ...generarDatos(),
  sesion: null,
  enLinea: true,
  sincronizando: false,
  planPublicado: {},
  avisos: [],
})

let idAviso = 0

export const useDemo = create<Estado>()(
  persist(
    (set, get) => {
      const editar = (id: string, f: (v: Visita) => Visita) =>
        set((s) => ({ visitas: s.visitas.map((v) => (v.id === id ? f(v) : v)) }))
      const syncActual = (): Visita['sync'] => (get().enLinea ? 'sincronizada' : 'pendiente')

      return {
        ...estadoInicial(),

        iniciar: (usuarioId) => set({ sesion: usuarioId }),
        salir: () => set({ sesion: null }),
        reiniciar: () => {
          set({ ...estadoInicial() })
          get().avisar('La demo volvió a su estado inicial')
        },
        avisar: (texto) => {
          const id = ++idAviso
          set((s) => ({ avisos: [...s.avisos, { id, texto }] }))
          setTimeout(() => get().cerrarAviso(id), 3200)
        },
        cerrarAviso: (id) => set((s) => ({ avisos: s.avisos.filter((a) => a.id !== id) })),

        agregarUsuario: (u) => set((s) => ({ usuarios: [...s.usuarios, { ...u, id: `u-nuevo-${Date.now()}` }] })),
        agregarPunto: (p) => set((s) => ({ puntos: [...s.puntos, { ...p, id: `p-nuevo-${Date.now()}` }] })),
        // El código del cliente evita duplicados: si ya existe, se actualiza
        importarPuntos: (filas) => {
          let nuevos = 0
          let actualizados = 0
          set((s) => {
            const puntos = [...s.puntos]
            filas.forEach((f, i) => {
              const k = puntos.findIndex((p) => p.codigo.toLowerCase() === f.codigo.toLowerCase())
              if (k >= 0) {
                puntos[k] = { ...puntos[k], ...f, lat: f.lat ?? puntos[k].lat, lng: f.lng ?? puntos[k].lng, ubicacionOrigen: f.lat ? 'base' : puntos[k].ubicacionOrigen }
                actualizados++
              } else {
                puntos.push({ ...f, id: `p-xl-${Date.now()}-${i}` })
                nuevos++
              }
            })
            return { puntos }
          })
          return { nuevos, actualizados }
        },
        // Persona + cliente + fecha identifican la visita: si ya está programada, se actualiza
        importarPlan: (filas) => {
          let nuevas = 0
          let actualizadas = 0
          set((s) => {
            const visitas = [...s.visitas]
            const fechas = new Set<string>()
            filas.forEach((f, i) => {
              fechas.add(f.fecha)
              const k = visitas.findIndex((v) => v.programada && v.usuarioId === f.usuarioId && v.puntoId === f.puntoId && v.fecha === f.fecha)
              if (k >= 0) {
                visitas[k] = { ...visitas[k], ...f, historial: [...visitas[k].historial, 'Actualizada desde Excel'] }
                actualizadas++
              } else {
                visitas.push({ ...f, id: `v-xl-${Date.now()}-${i}`, estado: 'programada', programada: true, historial: ['Cargada desde Excel'], novedadesPosteriores: [], sync: 'sincronizada' })
                nuevas++
              }
            })
            const planPublicado = { ...s.planPublicado }
            fechas.forEach((f) => (planPublicado[f] = false))
            return { visitas, planPublicado }
          })
          return { nuevas, actualizadas }
        },
        agregarALista: (lista, valor) =>
          set((s) => ({ listas: { ...s.listas, [lista]: [...s.listas[lista], valor] } })),

        agregarVisitaPlan: (v) =>
          set((s) => ({
            visitas: [
              ...s.visitas,
              { ...v, id: `v-plan-${Date.now()}`, estado: 'programada', programada: true, historial: ['Agregada al plan'], novedadesPosteriores: [], sync: 'sincronizada' },
            ],
            planPublicado: { ...s.planPublicado, [v.fecha]: false },
          })),
        publicarPlan: (fecha) => set((s) => ({ planPublicado: { ...s.planPublicado, [fecha]: true } })),
        reprogramar: (id, nuevaFecha) => {
          const v = get().visitas.find((x) => x.id === id)
          if (!v) return
          set((s) => ({
            visitas: [
              ...s.visitas.map((x) =>
                x.id === id ? { ...x, estado: 'reprogramada' as const, reprogramadaPara: nuevaFecha, historial: [...x.historial, `Reprogramada para ${nuevaFecha}`] } : x,
              ),
              {
                ...v,
                id: `v-rep-${Date.now()}`,
                fecha: nuevaFecha,
                estado: 'programada',
                origenId: v.id,
                orden: v.orden,
                historial: [`Viene de una visita reprogramada del ${v.fecha}`],
                novedadesPosteriores: [],
                llegada: undefined,
                salida: undefined,
              },
            ],
          }))
        },

        registrarLlegada: (id, d) => {
          const v = get().visitas.find((x) => x.id === id)
          const p = get().puntos.find((x) => x.id === v?.puntoId)
          // Cliente sin coordenadas: la ubicación de esta visita queda como referencia del punto
          if (v && p && p.lat === undefined) {
            const z = ZONAS[p.zona]
            set((s) => ({
              puntos: s.puntos.map((x) =>
                x.id === p.id ? { ...x, lat: z.lat + 0.006, lng: z.lng - 0.004, ubicacionOrigen: 'visita' as const, ubicacionFecha: v.fecha } : x,
              ),
            }))
            editar(id, (x) => ({ ...x, llegada: d.hora, ubicacionTomada: true, distanciaM: undefined, enRango: undefined }))
            return
          }
          editar(id, (x) => ({ ...x, llegada: d.hora, distanciaM: d.distanciaM, enRango: d.enRango }))
        },
        guardarFoto: (id, foto, tipo) => editar(id, (v) => (tipo === 'presencia' ? { ...v, foto } : { ...v, fotoExhibicion: foto })),
        usarFotoDemo: (id, tipo) => editar(id, (v) => (tipo === 'presencia' ? { ...v, fotoSemilla: 4242 } : { ...v, fotoExhibicionSemilla: 2424 })),
        agregarNovedad: (visitaId, n) =>
          editar(visitaId, (v) => ({
            ...v,
            novedadesPosteriores: [...v.novedadesPosteriores, { ...n, id: `n-${Date.now()}`, fecha: hoyDemo(), hora: horaActual() }],
          })),
        finalizarVisita: (id, hora, g) =>
          editar(id, (v) => ({
            ...v,
            ...g,
            salida: hora,
            estado: 'realizada',
            sync: syncActual(),
            historial: [...v.historial, `Registrada en campo a las ${hora}`],
          })),
        marcarNoRealizada: (id, motivo) =>
          editar(id, (v) => ({
            ...v,
            estado: 'no_realizada',
            motivoNoRealizacion: motivo,
            sync: syncActual(),
            historial: [...v.historial, `No realizada: ${motivo}`],
          })),
        crearNoProgramada: (usuarioId, puntoId, motivo) => {
          const id = `v-np-${Date.now()}`
          set((s) => ({
            visitas: [
              ...s.visitas,
              {
                id,
                usuarioId,
                puntoId,
                fecha: hoyDemo(),
                orden: 99,
                franja: '—',
                tipo: s.usuarios.find((u) => u.id === usuarioId)?.perfil === 'vendedora' ? 'Toma de pedido' : 'Impulso y asesoría',
                objetivo: 'Oportunidad detectada en ruta',
                impacto: '—',
                programada: false,
                estado: 'programada',
                motivoNoProgramada: motivo,
                historial: ['Registrada en campo como no programada'],
                novedadesPosteriores: [],
                sync: 'sincronizada',
              },
            ],
          }))
          return id
        },
        cambiarConexion: (enLinea) => {
          set({ enLinea })
          const pendientes = get().visitas.filter((v) => v.sync === 'pendiente').length
          if (enLinea && pendientes > 0) {
            set({ sincronizando: true })
            setTimeout(() => {
              set((s) => ({
                sincronizando: false,
                visitas: s.visitas.map((v) => (v.sync === 'pendiente' ? { ...v, sync: 'sincronizada' } : v)),
              }))
              get().avisar(`${pendientes} ${pendientes === 1 ? 'visita sincronizada' : 'visitas sincronizadas'} con el servidor`)
            }, 2200)
          }
        },
      }
    },
    {
      name: 'mns-demo-v2',
      storage: createJSONStorage(() => {
        try {
          localStorage.setItem('__t', '1')
          localStorage.removeItem('__t')
          return localStorage
        } catch {
          const mem = new Map<string, string>()
          return { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: (k) => void mem.delete(k) }
        }
      }),
      partialize: (s) => ({
        generadoPara: s.generadoPara,
        usuarios: s.usuarios,
        puntos: s.puntos,
        visitas: s.visitas,
        listas: s.listas,
        sesion: s.sesion,
        enLinea: s.enLinea,
        planPublicado: s.planPublicado,
      }),
      // Si la demo se abre otro día, se regeneran los datos para que "hoy" siempre tenga ruta.
      merge: (guardado, actual) => {
        const g = guardado as Partial<Estado> | undefined
        if (!g || g.generadoPara !== hoyDemo()) return actual
        return { ...actual, ...g }
      },
    },
  ),
)

export { siguienteHabil }
