import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import './App.css'
import ResetPassword from './pages/ResetPassword'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        <Route path="/forgot-password" element={<ForgotPassword/>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path='/reset-password/:token' element={<ResetPassword />} />
        <Route path="/reset-password/*" element={<ResetPassword />} />
        <Route path="/dashboard" element={
            <div className="p-8 text-center text-2xl">
              ✅ ¡Bienvenido! Dashboard — Sprint 2
            </div>
          } />
      </Routes>
    </BrowserRouter>
  );
}

export default App
