import { CalendarClock, CheckCircle2, CircleDashed, CircleSlash } from 'lucide-react'
import type { ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Usuario, Visita } from '../../data/types'
import { capitalizar, diasHabiles, fechaCorta, hoyDemo } from '../../lib/fechas'
import { filtrar, indicadores, META_CUMPLIMIENTO, porc, type Filtros } from '../../lib/metricas'

// Colores validados para lectura con daltonismo (programadas frente a realizadas)
const C_PROGRAMADAS = '#5b82cc'
const C_REALIZADAS = '#2f8a43'
const C_LINEA = '#1546a0'
const EJE = { fill: '#5d6b82', fontSize: 12 }
const TIP = { borderRadius: 12, border: '1px solid #d9e2ee', fontFamily: 'Onest, system-ui, sans-serif', fontSize: 13 }

interface Props {
  visitas: Visita[]
  usuarios: Usuario[]
  zonaDe: Map<string, string>
  filtros: Omit<Filtros, 'dias'>
  /** Visitas del periodo elegido (hoy o últimos 6 días), para el gráfico de estados. */
  delPeriodo: Visita[]
  etiquetaPeriodo: string
}

export function GraficosSeguimiento({ visitas, usuarios, zonaDe, filtros, delPeriodo, etiquetaPeriodo }: Props) {
  const hoy = hoyDemo()
  const porDia = diasHabiles(hoy, 6).map((d) => {
    const k = indicadores(filtrar(visitas, usuarios, zonaDe, { ...filtros, dias: [d] }))
    return {
      dia: d === hoy ? 'Hoy' : capitalizar(fechaCorta(d)).replace(/ \w+$/, ''),
      programadas: k.programadas,
      realizadas: k.realizadas,
      cumplimiento: k.programadas - k.porVisitar > 0 ? Math.round(k.cumplimiento * 100) : null,
    }
  })

  const k = indicadores(delPeriodo)
  const estados = [
    { t: 'Realizadas', n: k.realizadas, color: '#2f8a43', Icono: CheckCircle2 },
    { t: 'No realizadas', n: k.noRealizadas, color: '#c0392b', Icono: CircleSlash },
    { t: 'Reprogramadas', n: k.reprogramadas, color: '#d9a21b', Icono: CalendarClock },
    { t: 'Por visitar', n: k.porVisitar, color: '#9fb4dc', Icono: CircleDashed },
  ]
  const total = Math.max(1, k.programadas)

  return (
    <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <Tarjeta titulo="Programadas frente a realizadas" detalle="Visitas del plan por día, últimos 6 días. Hoy sigue en curso">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={porDia} margin={{ top: 20, right: 8, left: -18, bottom: 0 }} barGap={2} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke="#e6ecf4" />
            <XAxis dataKey="dia" tick={EJE} axisLine={false} tickLine={false} />
            <YAxis tick={EJE} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip cursor={{ fill: '#eef3f9' }} contentStyle={TIP} />
            <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 13, color: '#0e2a55' }} />
            <Bar isAnimationActive={false} dataKey="programadas" name="Programadas" fill={C_PROGRAMADAS} radius={[4, 4, 0, 0]} maxBarSize={22}>
              <LabelList dataKey="programadas" position="top" fill="#5d6b82" fontSize={11} />
            </Bar>
            <Bar isAnimationActive={false} dataKey="realizadas" name="Realizadas" fill={C_REALIZADAS} radius={[4, 4, 0, 0]} maxBarSize={22}>
              <LabelList dataKey="realizadas" position="top" fill="#0e2a55" fontSize={11} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Tarjeta>

      <Tarjeta titulo="Cumplimiento de ruta" detalle={`Por día; la línea punteada es la meta del ${porc(META_CUMPLIMIENTO)}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={porDia} margin={{ top: 20, right: 16, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e6ecf4" />
            <XAxis dataKey="dia" tick={EJE} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(x) => `${x}%`} tick={EJE} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => [`${v} %`, 'Cumplimiento']} contentStyle={TIP} />
            <ReferenceLine
              y={Math.round(META_CUMPLIMIENTO * 100)}
              stroke="#0e2a55"
              strokeDasharray="4 4"
            />
            <Line
              isAnimationActive={false}
              type="linear"
              dataKey="cumplimiento"
              stroke={C_LINEA}
              strokeWidth={2}
              connectNulls
              dot={{ r: 4, fill: C_LINEA, stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            >
              <LabelList dataKey="cumplimiento" position="top" formatter={(x) => (x == null ? '' : `${x}%`)} fill="#0e2a55" fontSize={11} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </Tarjeta>

      <Tarjeta titulo="Estado de las visitas" detalle={`${k.programadas} visitas del plan, ${etiquetaPeriodo}`} alto={false}>
        <ul className="space-y-4">
          {estados.map((e) => {
            const p = e.n / total
            return (
              <li key={e.t} title={`${e.t}: ${e.n} (${porc(p)})`}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="flex items-center gap-1.5 font-medium">
                    <e.Icono size={15} style={{ color: e.color }} aria-hidden />
                    {e.t}
                  </span>
                  <span className="tabular">
                    <strong>{e.n}</strong> <span className="text-gris">· {porc(p)}</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-niebla">
                  <div className="h-full rounded-full" style={{ width: `${p * 100}%`, background: e.color }} />
                </div>
              </li>
            )
          })}
        </ul>
        <p className="mt-5 border-t border-linea pt-3 text-sm text-gris">
          Además, <strong className="text-tinta">{k.adicionales}</strong> visitas no programadas como gestión adicional.
        </p>
      </Tarjeta>
    </section>
  )
}

function Tarjeta({ titulo, detalle, children, alto = true }: { titulo: string; detalle: string; children: ReactNode; alto?: boolean }) {
  return (
    <div className="rounded-2xl border border-linea bg-white p-5">
      <h2 className="font-semibold">{titulo}</h2>
      <p className="mt-0.5 text-sm text-gris">{detalle}</p>
      <div className={`mt-4 ${alto ? 'h-[260px]' : ''}`}>{children}</div>
    </div>
  )
}
