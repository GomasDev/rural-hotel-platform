import { BrowserRouter, Route, Routes } from 'react-router-dom'

// Páginas públicas
import LandingPage    from './pages/public/LandingPage'
import HotelDetail    from './pages/public/HotelDetail'
import Login          from './pages/public/Login'
import Register       from './pages/public/Register'
import ForgotPassword from './pages/public/ForgotPassword'
import ResetPassword  from './pages/public/ResetPassword'

// Páginas del dashboard
import Dashboard    from './pages/dashboard/Dashboard'
import Hotels       from './pages/dashboard/Hotels'
import Rooms        from './pages/dashboard/Rooms'
import Reservations from './pages/dashboard/Reservations'
import HikingRoutes from './pages/dashboard/HikingRoutes'
import Activities   from './pages/dashboard/Activities'
import Users        from './pages/dashboard/Users'

// Componentes
import ProtectedRoute  from './components/ProtectedRoute'
import GuestRoute      from './components/GuestRoute'
import DashboardLayout from './components/layouts/DashboardLayout'
import { AuthProvider } from './context/AuthContext'

import './App.css'
import Analytics from './pages/dashboard/Analytics'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Rutas públicas (sin restricción) ── */}
          <Route path="/"                      element={<LandingPage />} />
          <Route path="/hotels/:id"            element={<HotelDetail />} />
          <Route path="/reset-password"        element={<ResetPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* ── Rutas solo para NO autenticados ── */}
          <Route path="/login" element={
            <GuestRoute><Login /></GuestRoute>
          } />
          <Route path="/register" element={
            <GuestRoute><Register /></GuestRoute>
          } />
          <Route path="/forgot-password" element={
            <GuestRoute><ForgotPassword /></GuestRoute>
          } />

          {/* ── Dashboard (protegido) ── */}
          <Route path="/dashboard/*" element={
            <ProtectedRoute element={<DashboardLayout />} />
          }>
            <Route index             element={<Dashboard />} />
            <Route path="hotels"       element={<Hotels />} />
            <Route path="rooms"        element={<Rooms />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="hiking-routes" element={<HikingRoutes />} />
            <Route path="activities"   element={<Activities />} />
            <Route path="users"        element={<Users />} />
            <Route path="analytics"    element={<Analytics />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App