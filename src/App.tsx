import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Avisos } from './components/ui'
import { Ingreso } from './pages/Ingreso'
import { PanelLayout } from './pages/panel/PanelLayout'
import { Seguimiento } from './pages/panel/Seguimiento'
import { Planificacion } from './pages/panel/Planificacion'
import { Administracion } from './pages/panel/Administracion'
import { DetalleVisita } from './pages/panel/DetalleVisita'
import { CampoLayout } from './pages/campo/CampoLayout'
import { RutaDelDia } from './pages/campo/RutaDelDia'
import { FlujoVisita } from './pages/campo/FlujoVisita'
import { NuevaNoProgramada } from './pages/campo/NuevaNoProgramada'
import { useDemo } from './store'
import type { ReactNode } from 'react'

function ConSesion({ children }: { children: ReactNode }) {
  const sesion = useDemo((s) => s.sesion)
  return sesion ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Ingreso />} />
        <Route
          path="/panel"
          element={
            <ConSesion>
              <PanelLayout />
            </ConSesion>
          }
        >
          <Route index element={<Navigate to="seguimiento" replace />} />
          <Route path="seguimiento" element={<Seguimiento />} />
          <Route path="planificacion" element={<Planificacion />} />
          <Route path="administracion" element={<Administracion />} />
          <Route path="visita/:id" element={<DetalleVisita />} />
        </Route>
        <Route
          path="/campo"
          element={
            <ConSesion>
              <CampoLayout />
            </ConSesion>
          }
        >
          <Route index element={<RutaDelDia />} />
          <Route path="visita/:id" element={<FlujoVisita />} />
          <Route path="no-programada" element={<NuevaNoProgramada />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Avisos />
    </HashRouter>
  )
}
