import { History, Minus, Plus, X } from 'lucide-react'
import { useState } from 'react'
import type { Faltante, NovedadPosterior } from '../data/types'
import { fechaCorta } from '../lib/fechas'
import { useDemo } from '../store'
import { Boton, Campo, claseInput } from './ui'

/** Línea de tiempo de las novedades registradas después de cerrar la visita. */
export function ListaNovedades({ novedades }: { novedades: NovedadPosterior[] }) {
  if (novedades.length === 0) return <p className="text-sm text-gris">Sin novedades después del cierre.</p>
  return (
    <ol className="space-y-3 border-l-2 border-ambar/40 pl-4">
      {novedades.map((n) => (
        <li key={n.id}>
          <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <span className="font-semibold">{n.motivo}</span>
            <span className="text-xs text-gris tabular">
              {fechaCorta(n.fecha)}, {n.hora} · {n.autor}
            </span>
          </div>
          <p className="mt-0.5 text-sm">{n.detalle}</p>
        </li>
      ))}
    </ol>
  )
}

/** Agrega una novedad a una visita cerrada sin modificar su registro original. */
export function FormNovedad({ visitaId, autor, onListo }: { visitaId: string; autor: string; onListo: () => void }) {
  const motivos = useDemo((s) => s.listas.motivosNovedad)
  const agregar = useDemo((s) => s.agregarNovedad)
  const avisar = useDemo((s) => s.avisar)
  const [motivo, setMotivo] = useState(motivos[0])
  const [detalle, setDetalle] = useState('')
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (!detalle.trim()) return
        agregar(visitaId, { motivo, detalle: detalle.trim(), autor })
        avisar('Novedad agregada. El registro original de la visita no cambia')
        onListo()
      }}
    >
      <p className="flex items-start gap-2 rounded-xl bg-niebla p-3 text-sm text-gris">
        <History size={16} className="mt-0.5 shrink-0" aria-hidden />
        La visita ya está cerrada. La novedad queda como un registro adicional con fecha, hora y responsable.
      </p>
      <Campo etiqueta="Motivo">
        <select className={claseInput} value={motivo} onChange={(e) => setMotivo(e.target.value)}>
          {motivos.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </Campo>
      <Campo etiqueta="Detalle">
        <textarea
          required
          rows={3}
          className={claseInput}
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
          placeholder="Ej.: al recibir el pedido devolvió 6 unidades de Omega 3 por fecha corta"
        />
      </Campo>
      <div className="flex justify-end gap-2">
        <Boton type="button" variante="fantasma" onClick={onListo}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={!detalle.trim()}>
          Guardar novedad
        </Boton>
      </div>
    </form>
  )
}

/** Referencias faltantes en el punto de venta, cada una con su cantidad. */
export function EditorFaltantes({ productos, valor, onCambio }: { productos: string[]; valor: Faltante[]; onCambio: (v: Faltante[]) => void }) {
  const libres = productos.filter((p) => !valor.some((f) => f.producto === p))
  const cambiar = (i: number, d: number) => onCambio(valor.map((f, k) => (k === i ? { ...f, cantidad: Math.max(1, f.cantidad + d) } : f)))
  return (
    <div className="space-y-2">
      {valor.map((f, i) => (
        <div key={f.producto} className="flex items-center gap-2 rounded-xl border border-linea bg-white p-2 pl-3">
          <span className="min-w-0 flex-1 text-sm leading-tight font-medium">{f.producto}</span>
          <button type="button" aria-label={`Restar ${f.producto}`} onClick={() => cambiar(i, -1)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-niebla">
            <Minus size={15} />
          </button>
          <input
            aria-label={`Cantidad faltante de ${f.producto}`}
            inputMode="numeric"
            className="w-12 rounded-lg border border-linea py-1 text-center text-sm font-bold tabular"
            value={f.cantidad}
            onChange={(e) => onCambio(valor.map((x, k) => (k === i ? { ...x, cantidad: Number(e.target.value.replace(/\D/g, '')) || 1 } : x)))}
          />
          <button type="button" aria-label={`Sumar ${f.producto}`} onClick={() => cambiar(i, 1)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-niebla">
            <Plus size={15} />
          </button>
          <button type="button" aria-label={`Quitar ${f.producto}`} onClick={() => onCambio(valor.filter((_, k) => k !== i))} className="flex h-8 w-8 items-center justify-center rounded-lg text-gris">
            <X size={15} />
          </button>
        </div>
      ))}
      {libres.length > 0 && (
        <select
          aria-label="Agregar producto faltante"
          className={`${claseInput} text-sm text-gris`}
          value=""
          onChange={(e) => e.target.value && onCambio([...valor, { producto: e.target.value, cantidad: 6 }])}
        >
          <option value="">{valor.length ? 'Agregar otra referencia' : 'Agregar referencia faltante'}</option>
          {libres.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      )}
    </div>
  )
}
