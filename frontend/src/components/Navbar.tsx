import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-white shadow-sm">
      <h1 className="text-2xl font-bold text-green-700">🏡 RuralHot</h1>
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 border border-green-700 text-green-700 rounded-lg hover:bg-green-50 transition"
        >
          Iniciar sesión
        </button>
        <button
          onClick={() => navigate('/register')}
          className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition"
        >
          Registrarse
        </button>
      </div>
    </nav>
  );
}
