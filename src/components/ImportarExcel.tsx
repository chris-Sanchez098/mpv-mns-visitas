import { AlertCircle, CheckCircle2, FileSpreadsheet, RefreshCw, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { leerExcel, type Fila, type Revision } from '../lib/importar'
import { Boton, Modal } from './ui'

/**
 * Carga masiva desde Excel en tres pasos: elegir archivo, revisar (nuevos, actualizaciones y errores) y confirmar.
 * Las filas con error no se cargan; el resto sí, sin crear duplicados.
 */
export function ImportarExcel<T>({
  titulo,
  explicacion,
  llave,
  onDescargarPlantilla,
  ejemplo,
  revisar,
  onConfirmar,
  onCerrar,
}: {
  titulo: string
  explicacion: string
  llave: string
  onDescargarPlantilla: () => void
  /** Filas de ejemplo para probar la carga en la demo sin tener un archivo */
  ejemplo: Fila[]
  revisar: (filas: Fila[]) => Revision<T>
  onConfirmar: (validas: T[]) => void
  onCerrar: () => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [archivo, setArchivo] = useState('')
  const [rev, setRev] = useState<Revision<T> | null>(null)
  const [error, setError] = useState('')

  const procesar = (filas: Fila[], nombre: string) => {
    setError('')
    if (filas.length === 0) return setError('El archivo no tiene filas con datos.')
    setArchivo(nombre)
    setRev(revisar(filas))
  }

  return (
    <Modal titulo={titulo} onCerrar={onCerrar} ancho="max-w-2xl">
      {!rev ? (
        <div className="space-y-4">
          <p className="text-gris">{explicacion}</p>
          <p className="rounded-xl bg-niebla p-3 text-sm">
            <strong>Sin duplicados:</strong> {llave}
          </p>
          <div className="rounded-2xl border-2 border-dashed border-cobalto-100 p-6 text-center">
            <FileSpreadsheet className="mx-auto text-cobalto" size={32} aria-hidden />
            <p className="mt-2 font-medium">Selecciona el archivo de Excel diligenciado</p>
            <p className="text-sm text-gris">Formato .xlsx o .csv con las columnas de la plantilla</p>
            <input
              ref={input}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (!f) return
                try {
                  procesar(await leerExcel(f), f.name)
                } catch {
                  setError('No pudimos leer el archivo. Verifica que sea un Excel con la estructura de la plantilla.')
                }
              }}
            />
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Boton onClick={() => input.current?.click()}>
                <Upload size={17} aria-hidden /> Elegir archivo
              </Boton>
              <Boton variante="secundario" onClick={onDescargarPlantilla}>
                Descargar plantilla
              </Boton>
            </div>
            {error && <p className="mt-3 text-sm text-alerta">{error}</p>}
          </div>
          <button onClick={() => procesar(ejemplo, 'archivo de ejemplo')} className="text-sm font-medium text-cobalto hover:underline">
            Probar con un archivo de ejemplo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gris">
            Revisión de <strong className="text-tinta">{archivo}</strong>: {rev.validas.length + rev.errores.length} filas.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Resumen n={rev.nuevas} t="nuevos" Icono={CheckCircle2} clase="bg-hoja-50 text-hoja" />
            <Resumen n={rev.actualizadas} t="actualizan registros existentes" Icono={RefreshCw} clase="bg-cobalto-50 text-cobalto" />
            <Resumen n={rev.errores.length} t="con errores, no se cargan" Icono={AlertCircle} clase={rev.errores.length ? 'bg-alerta-50 text-alerta' : 'bg-niebla text-gris'} />
          </div>
          {rev.errores.length > 0 && (
            <div className="rounded-xl border border-alerta/30 p-3">
              <p className="text-sm font-semibold">Corrige estas filas y vuelve a cargarlas:</p>
              <ul className="mt-2 space-y-1 text-sm">
                {rev.errores.map((e) => (
                  <li key={e.fila}>
                    <span className="font-medium tabular">Fila {e.fila}:</span> {e.mensaje}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Boton variante="fantasma" onClick={() => setRev(null)}>
              Elegir otro archivo
            </Boton>
            <Boton disabled={rev.validas.length === 0} onClick={() => onConfirmar(rev.validas)}>
              Cargar {rev.validas.length} {rev.validas.length === 1 ? 'fila' : 'filas'}
            </Boton>
          </div>
        </div>
      )}
    </Modal>
  )
}

function Resumen({ n, t, Icono, clase }: { n: number; t: string; Icono: typeof CheckCircle2; clase: string }) {
  return (
    <div className={`rounded-xl p-3 ${clase}`}>
      <Icono size={18} aria-hidden />
      <div className="mt-1 text-2xl font-bold tabular">{n}</div>
      <div className="text-xs">{t}</div>
    </div>
  )
}
