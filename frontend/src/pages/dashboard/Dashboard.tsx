import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-4 bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-green-700">🏡 RuralHot Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
        >
          Cerrar sesión
        </button>
      </nav>

      {/* Content */}
      <div className="p-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">✅ ¡Bienvenido!</h2>
          <p className="text-gray-600">Dashboard — Sprint 2</p>
          <p className="text-gray-500 text-sm mt-4">Autenticado y listo para usar.</p>
        </div>
      </div>
    </div>
  );
}
