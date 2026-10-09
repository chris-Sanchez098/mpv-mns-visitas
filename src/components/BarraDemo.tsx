import { FlaskConical, RotateCcw, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDemo } from '../store'

/** Franja fija que deja claro que es un prototipo y permite cambiar de perfil o reiniciar. */
export function BarraDemo() {
  const salir = useDemo((s) => s.salir)
  const reiniciar = useDemo((s) => s.reiniciar)
  const sesion = useDemo((s) => s.sesion)
  const nav = useNavigate()
  return (
    <div className="flex items-center justify-between gap-3 bg-tinta px-4 py-1.5 text-xs text-white/85">
      <span className="flex items-center gap-1.5">
        <FlaskConical size={13} aria-hidden />
        <span className="hidden sm:inline">Prototipo con datos de demostración</span>
        <span className="sm:hidden">Prototipo</span>
      </span>
      <div className="flex items-center gap-1">
        {sesion && (
          <button
            onClick={() => {
              salir()
              nav('/')
            }}
            className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-white/10"
          >
            <Users size={13} aria-hidden /> Cambiar perfil
          </button>
        )}
        <button
          onClick={() => {
            if (confirm('¿Reiniciar la demo? Se borran las visitas registradas en esta sesión.')) {
              reiniciar()
              nav('/')
            }
          }}
          className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-white/10"
        >
          <RotateCcw size={13} aria-hidden /> Reiniciar demo
        </button>
      </div>
    </div>
  )
}
