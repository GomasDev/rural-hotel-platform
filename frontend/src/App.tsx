import { BrowserRouter, Route, Routes } from 'react-router-dom'

// Páginas públicas
import LandingPage   from './pages/public/LandingPage'
import HotelDetail   from './pages/public/HotelDetail'
import Login         from './pages/public/Login'
import Register      from './pages/public/Register'
import ForgotPassword from './pages/public/ForgotPassword'
import ResetPassword from './pages/public/ResetPassword'

// Páginas del dashboard
import Dashboard   from './pages/dashboard/Dashboard'
import Hotels      from './pages/dashboard/Hotels'
import Rooms       from './pages/dashboard/Rooms'
import Reservations from './pages/dashboard/Reservations'

// Componentes
import ProtectedRoute   from './components/ProtectedRoute'
import DashboardLayout  from './components/layouts/DashboardLayout'
import { AuthProvider } from './context/AuthContext'

import './App.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Rutas públicas ── */}
          <Route path="/"                      element={<LandingPage />} />
          <Route path="/hotels/:id"            element={<HotelDetail />} />
          <Route path="/login"                 element={<Login />} />
          <Route path="/register"              element={<Register />} />
          <Route path="/forgot-password"       element={<ForgotPassword />} />
          <Route path="/reset-password"        element={<ResetPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* ── Dashboard (protegido) ── */}
          <Route path="/dashboard/*" element={
            <ProtectedRoute element={<DashboardLayout />} />
          }>
            <Route index          element={<Dashboard />} />
            <Route path="hotels"       element={<Hotels />} />
            <Route path="rooms"        element={<Rooms />} />
            <Route path="reservations" element={<Reservations />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App