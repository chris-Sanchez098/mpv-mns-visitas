import { ArrowLeft, Search } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Boton, Campo, claseInput } from '../../components/ui'
import { useDemo } from '../../store'

const MOTIVOS = ['El cliente llamó a pedir producto', 'Punto cercano a la ruta', 'Reposición urgente por agotado', 'Apertura de un cliente nuevo']

export function NuevaNoProgramada() {
  const usuario = useDemo((s) => s.usuarios.find((u) => u.id === s.sesion))
  const puntos = useDemo((s) => s.puntos)
  const crear = useDemo((s) => s.crearNoProgramada)
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [puntoId, setPuntoId] = useState('')
  const [motivo, setMotivo] = useState(MOTIVOS[0])
  if (!usuario) return null

  const lista = puntos.filter((p) => usuario.zonas.includes(p.zona) && p.nombre.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="space-y-4 p-4">
      <Link to="/campo" className="inline-flex items-center gap-1 text-sm font-medium text-gris">
        <ArrowLeft size={16} aria-hidden /> Ruta de hoy
      </Link>
      <div>
        <h1 className="text-lg font-bold">Visita no programada</h1>
        <p className="text-sm text-gris">Se mide aparte como gestión adicional y no reemplaza ninguna visita de tu ruta.</p>
      </div>
      <div className="rounded-2xl bg-white p-4">
        <label className="relative block">
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-gris" aria-hidden />
          <input className={`${claseInput} pl-9`} placeholder="Buscar punto de venta" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar punto de venta" />
        </label>
        <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto">
          {lista.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => setPuntoId(p.id)}
                aria-pressed={puntoId === p.id}
                className={`w-full rounded-xl border p-3 text-left ${puntoId === p.id ? 'border-cobalto bg-cobalto-50' : 'border-linea'}`}
              >
                <span className="block text-sm font-semibold">{p.nombre}</span>
                <span className="block text-xs text-gris">
                  {p.direccion} · {p.zona}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl bg-white p-4">
        <Campo etiqueta="¿Por qué haces esta visita?">
          <select className={claseInput} value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            {MOTIVOS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Campo>
      </div>
      <Boton className="w-full py-3.5" disabled={!puntoId} onClick={() => nav(`/campo/visita/${crear(usuario.id, puntoId, motivo)}`, { replace: true })}>
        Iniciar visita
      </Boton>
    </div>
  )
}
