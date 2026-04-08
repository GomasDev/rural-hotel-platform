import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">

        {/* Logo */}
        <button onClick={() => navigate('/')} className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🏡</span>
          <span className="text-lg font-bold text-green-700 tracking-tight">RuralHot</span>
        </button>

        {/* Barra de búsqueda central estilo Airbnb */}
        <div className="hidden md:flex items-center border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow divide-x divide-gray-200 bg-white">
          <button className="px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 rounded-l-full transition">
            Destino
          </button>
          <button className="px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition">
            Llegada
          </button>
          <button className="px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition">
            Salida
          </button>
          <button className="flex items-center gap-2 pl-4 pr-2 py-1.5 rounded-full transition group">
            <span className="text-sm font-semibold text-gray-500">Viajeros</span>
            <span className="bg-green-700 text-white p-2 rounded-full group-hover:bg-green-800 transition">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
          </button>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/login')}
            className="hidden md:block px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-full transition"
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => navigate('/register')}
            className="flex items-center gap-2 border border-gray-200 rounded-full px-3 py-2 hover:shadow-md transition-shadow bg-white"
          >
            {/* Hamburger */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
}