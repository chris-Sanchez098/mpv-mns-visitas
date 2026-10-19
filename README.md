# Ruta Millenium · Prototipo

Prototipo navegable de la herramienta de **planificación y seguimiento de visitas comerciales** para Millenium Natural Systems. Sirve para mostrarle al cliente lo que va a recibir: no tiene backend, los datos son de demostración y las transiciones son simuladas.

## Qué incluye

| Propuesta | En el prototipo |
| --- | --- |
| Módulo de Administración | Usuarios por perfil, clientes con código, clientes sin dirección, listas configurables y **carga de clientes desde Excel** sin duplicados (el código es la llave). |
| Módulo de Planificación | Plan por persona y día con orden, franja, tipo, objetivo e impacto; estados; copiar el plan de hoy; publicar; reprogramar con historial; **carga de la programación desde Excel** (persona + cliente + fecha es la llave). |
| Módulo de Registro en Campo | Llegada con hora y ubicación validada; clientes sin dirección toman su ubicación en la primera visita; **vendedoras: una foto al inicio de la jornada**; **impulsadoras: llegada y foto del almacén al empezar; unidades, faltantes y foto de la exhibición al cerrar el día**; formularios con estimado de pedido, unidades, estado de cartera, faltantes con cantidades, gestión "Otros", observaciones de POP y la actividad Capacitación; **novedades posteriores al cierre**; modo sin conexión. |
| Módulo de Seguimiento | Resumen del Director Comercial: programadas y ejecutadas, gráficos, actividades y gestiones, evidencias fotográficas, pedidos estimados y unidades, faltantes, estado de cartera, novedades posteriores, desviaciones, mapa, detalle de cada visita y **exportación a Excel**. |

**Protección de datos (Ley 1581 de 2012):** la primera vez que una persona de campo entra, acepta la autorización de tratamiento de datos (finalidades, datos que se recolectan, lo que la herramienta no hace y derechos del titular). La aceptación queda registrada con fecha y hora en *Administración → Usuarios*, y la política se puede consultar desde el ingreso, la app de campo y el panel. El texto es de demostración: la versión final la define la compañía con su asesoría legal.

No muestra nada de lo que está en exclusiones (integraciones, alertas por otros medios, optimización de rutas).

## Guion de la demo (7 minutos)

1. **Ingreso:** hay un perfil por rol. Entra como **Dirección Comercial** (Edison Muñoz) y muestra el cumplimiento, los gráficos y la sección de gestión: actividades, faltantes (pulsa una referencia para ver en qué puntos falta), cartera y novedades.
2. **Carga por Excel:** en *Administración → Clientes* pulsa **Cargar desde Excel → Probar con un archivo de ejemplo**: se ven los clientes nuevos, los que se actualizan por código y las filas con error. Repite en *Planificación* con **Cargar programación desde Excel** y publica el plan.
3. **Campo (impulsadora):** *Ver app de campo*. Al llegar al almacén: **registrar llegada** y **foto del almacén**; la visita queda *en jornada*. Al final del día: **Cerrar la jornada** → unidades vendidas, faltantes con cantidades, POP y actividades → **foto de la exhibición**, que registra la salida. La segunda visita es a un **cliente sin dirección**: al registrar la llegada, su ubicación queda guardada.
4. **Campo (vendedora):** cambia a *vendedora*. En la primera visita se pide la **foto de inicio de jornada**; en la segunda ya no. Muestra estimado de pedido, unidades, estado de cartera y la gestión *Otros*.
5. **Novedad posterior:** *Visitas anteriores y novedades* → abre una visita cerrada → **Agregar** una devolución. El registro original no cambia.
6. **Sin conexión:** activa *Sin conexión*, registra una visita y vuelve a *En línea* para sincronizar.
7. **El momento clave:** pulsa **Ver el panel de Dirección Comercial**. Todo lo registrado ya está en el resumen y en el detalle de cada visita. Cierra con **Exportar a Excel**.

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
