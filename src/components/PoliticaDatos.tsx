import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Boton, Modal } from './ui'

/**
 * Aviso de privacidad y autorización de tratamiento de datos personales (Ley 1581 de 2012).
 * El texto es un borrador para la demo: la versión final la define y valida la compañía con su asesoría legal.
 */
export function TextoPolitica({ resumido = false }: { resumido?: boolean }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      <section>
        <h3 className="font-semibold">Responsable del tratamiento</h3>
        <p className="mt-1 text-gris">
          Natural Systems International S.A. (Millenium Natural Systems), Cali, Valle del Cauca. Canal de atención para consultas y reclamos sobre datos personales:{' '}
          <span className="text-tinta">[correo de protección de datos de la compañía]</span>.
        </p>
      </section>
      <section>
        <h3 className="font-semibold">Datos que se recolectan</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-gris">
          <li>Datos de identificación y contacto: nombre, cargo, zona y teléfono.</li>
          <li>Hora de llegada y de salida de cada visita.</li>
          <li>Ubicación del dispositivo, tomada solo en el momento de registrar la llegada. La herramienta no rastrea la ubicación de forma continua.</li>
          <li>Fotografías del punto de venta y de la exhibición de productos, tomadas desde la herramienta.</li>
          <li>La información comercial registrada en cada visita.</li>
        </ul>
      </section>
      <section>
        <h3 className="font-semibold">Finalidades</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-gris">
          <li>Planificar las visitas comerciales y verificar que se realizaron en el lugar y la hora correspondientes.</li>
          <li>Registrar la gestión comercial y la ejecución en los puntos de venta.</li>
          <li>Generar indicadores de cumplimiento y resultado para la Dirección Comercial.</li>
        </ul>
        {!resumido && <p className="mt-2 text-gris">Los datos no se usan para fines distintos a los informados ni se comparten con terceros ajenos a la operación.</p>}
      </section>
      <section>
        <h3 className="font-semibold">Lo que la herramienta no hace</h3>
        <p className="mt-1 text-gris">
          Funciona desde el navegador y solo pide permiso de cámara y ubicación al registrar una visita. No accede a la galería, los contactos, los archivos ni a otra información guardada en el dispositivo.
        </p>
      </section>
      <section>
        <h3 className="font-semibold">Sus derechos</h3>
        <p className="mt-1 text-gris">
          Como titular puede conocer, actualizar y rectificar sus datos; solicitar prueba de esta autorización; ser informado del uso que se les ha dado; revocar la autorización o pedir la supresión de los datos cuando proceda; presentar quejas ante la Superintendencia de Industria y Comercio; y acceder gratuitamente a sus datos.
        </p>
      </section>
      <p className="rounded-xl bg-ambar-50 p-3 text-xs text-ambar">Texto de demostración. La versión final la define y valida la compañía con su asesoría legal.</p>
    </div>
  )
}

/** Pantalla de autorización que cada persona acepta al ingresar por primera vez. */
export function AutorizacionDatos({ nombre, onAceptar }: { nombre: string; onAceptar: () => void }) {
  const [acepto, setAcepto] = useState(false)
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cobalto-50 text-cobalto">
          <ShieldCheck size={22} aria-hidden />
        </span>
        <div>
          <h1 className="text-lg leading-tight font-bold">Tratamiento de datos personales</h1>
          <p className="text-sm text-gris">Antes de empezar, {nombre.split(' ')[0]}, lee cómo se usan tus datos.</p>
        </div>
      </div>
      <div className="rounded-2xl bg-white p-4">
        <TextoPolitica resumido />
      </div>
      <label className="flex items-start gap-3 rounded-2xl bg-white p-4 text-sm">
        <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-cobalto" />
        <span>
          Autorizo a Natural Systems International S.A. para tratar mis datos personales con las finalidades informadas, conforme a la Ley 1581 de 2012.
        </span>
      </label>
      <Boton className="w-full py-3.5" disabled={!acepto} onClick={onAceptar}>
        Aceptar y continuar
      </Boton>
      <p className="text-center text-xs text-gris">La aceptación queda registrada con fecha y hora como prueba de la autorización.</p>
    </div>
  )
}

/** Enlace que abre la política completa en una ventana. */
export function EnlacePolitica({ className = '' }: { className?: string }) {
  const [abierta, setAbierta] = useState(false)
  return (
    <>
      <button onClick={() => setAbierta(true)} className={`inline-flex items-center gap-1 underline-offset-2 hover:underline ${className}`}>
        <ShieldCheck size={14} aria-hidden /> Política de tratamiento de datos
      </button>
      {abierta && (
        <Modal titulo="Política de tratamiento de datos personales" onCerrar={() => setAbierta(false)}>
          <TextoPolitica />
        </Modal>
      )}
    </>
  )
}
