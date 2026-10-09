# Ruta Millenium · Prototipo

Prototipo navegable de la herramienta de **planificación y seguimiento de visitas comerciales** para Millenium Natural Systems. Sirve para mostrarle al cliente lo que va a recibir: no tiene backend, los datos son de demostración y las transiciones son simuladas.

## Qué incluye

| Propuesta | En el prototipo |
| --- | --- |
| Módulo de Administración | Usuarios por perfil, puntos de venta con ubicación, listas configurables, descarga de la plantilla de carga inicial (Excel real). |
| Módulo de Planificación | Plan por persona y día con orden, franja, tipo, objetivo e impacto; estados; copiar el plan de hoy; publicar; reprogramar con historial. |
| Módulo de Registro en Campo | Ruta del día, llegada con validación de ubicación (simulada), **foto con la cámara real del dispositivo**, formularios de impulsadora y vendedora, motivo de no realización, visitas no programadas, **modo sin conexión con sincronización**. |
| Módulo de Seguimiento | Cumplimiento de ruta frente a la meta, planificado vs. ejecutado, gestión adicional, resultados por perfil, ruta de cada persona, desviaciones, mapa, cumplimiento por zona, evidencia de cada visita, compromisos, filtros y **exportación a Excel (real)**. |

No muestra nada de lo que está en exclusiones (integraciones, alertas por otros medios, optimización de rutas).

## Guion de la demo (5 minutos)

1. **Ingreso:** explica que hay un perfil por rol. Entra como **Dirección Comercial** y muestra el cumplimiento de hoy, las desviaciones y la ruta de cada persona (cada cápsula es una visita; clic para ver la evidencia).
2. **Planificación:** entra a *Planificación*, elige *Mañana*, pulsa **Copiar el plan de hoy** y luego **Publicar plan**. Reprograma una visita para mostrar el historial.
3. **Campo (impulsadora):** pulsa *Ver app de campo*. Abre la primera visita: **Registrar llegada** → validación de ubicación → **Tomar foto** (cámara real) → formulario → **Registrar salida**.
4. **Sin conexión:** activa *Sin conexión* en la parte superior, registra otra visita y muestra que queda guardada en el dispositivo. Vuelve a *En línea* y se sincroniza.
5. **El momento clave:** pulsa **Ver el panel de Dirección Comercial**. Las visitas que acabas de registrar ya suman en el indicador, aparecen en *Últimas visitas registradas* con su foto y en el mapa.
6. Cierra con **Exportar a Excel**.

*Reiniciar demo* (barra superior) deja todo como al inicio para la siguiente presentación. Si la demo se abre otro día, los datos se regeneran solos para que siempre haya ruta “hoy”.

> La cámara exige HTTPS (Vercel y Netlify lo dan por defecto). Si el navegador no da permiso, la app ofrece una foto de demostración para continuar.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
```

React 19 + Vite + TypeScript + Tailwind 4, Zustand (estado guardado en el navegador), Recharts, Leaflet con OpenStreetMap y SheetJS para Excel. Las rutas usan `HashRouter` y `base: './'`, así que funciona en cualquier hosting estático sin configuración.

### Estructura

```
src/
  data/       tipos y generador de datos de demostración (personas, puntos en el Valle del Cauca, productos)
  lib/        fechas, indicadores y exportación a Excel
  store.ts    estado de la demo y acciones simuladas (registro, sincronización, plan)
  components/ cámara, foto de visita, piezas de interfaz
  pages/      ingreso, panel web (seguimiento, planificación, administración, detalle) y app de campo
```

## Despliegue

**Vercel:** *Add New → Project*, importa este repositorio y acepta los valores detectados (Vite, `npm run build`, salida `dist`).

**Netlify:** *Add new site → Import an existing project*, comando `npm run build`, carpeta `dist`.

Cada push a `main` actualiza la URL.
