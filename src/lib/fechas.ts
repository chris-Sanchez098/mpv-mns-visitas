const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export function iso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function desdeIso(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Día de operación de la demo: hoy, o el sábado anterior si hoy es domingo. */
export function hoyDemo(): string {
  const d = new Date()
  if (d.getDay() === 0) d.setDate(d.getDate() - 1)
  return iso(d)
}

/** Últimos n días hábiles (lunes a sábado) que terminan en `fin`, en orden ascendente. */
export function diasHabiles(fin: string, n: number): string[] {
  const out: string[] = []
  const d = desdeIso(fin)
  while (out.length < n) {
    if (d.getDay() !== 0) out.unshift(iso(d))
    d.setDate(d.getDate() - 1)
  }
  return out
}

export function siguienteHabil(fecha: string): string {
  const d = desdeIso(fecha)
  do d.setDate(d.getDate() + 1)
  while (d.getDay() === 0)
  return iso(d)
}

export function fechaLarga(s: string): string {
  const d = desdeIso(s)
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`
}

export function fechaCorta(s: string): string {
  const d = desdeIso(s)
  return `${DIAS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`
}

export function horaActual(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function pesos(n: number): string {
  return '$ ' + Math.round(n).toLocaleString('es-CO')
}

export function pesosCortos(n: number): string {
  if (n >= 1_000_000) return `$ ${(n / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} M`
  if (n >= 1_000) return `$ ${Math.round(n / 1_000).toLocaleString('es-CO')} mil`
  return pesos(n)
}

export function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
