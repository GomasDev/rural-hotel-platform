import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'
import ResetPassword from './pages/ResetPassword'
import { AuthProvider } from './context/AuthContext'
import DashboardLayout from './components/DashboardLayout'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/register" element={<Register/>} />
          <Route path="/forgot-password" element={<ForgotPassword/>} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path='/reset-password/:token' element={<ResetPassword />} />
          <Route path="/reset-password/*" element={<ResetPassword />} />
          <Route path="/dashboard/*" element={
            <ProtectedRoute element={<DashboardLayout />} />
          }>
            <Route index element={<Dashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App
