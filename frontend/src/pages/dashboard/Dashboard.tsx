import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => { logout(); navigate('/login'); };

  const isAdmin      = user?.role === 'admin';
  const isSuperadmin = user?.role === 'superadmin';
  const isClient     = user?.role === 'client';

  const adminCards = [
    { icon: '🏨', title: 'Mis hoteles',     desc: 'Gestiona tus alojamientos',          color: 'from-green-50 to-emerald-100',  border: 'border-green-100',  to: '/dashboard/hotels'       },
    { icon: '🛏️', title: 'Habitaciones',    desc: 'Configura precios y disponibilidad', color: 'from-blue-50 to-sky-100',        border: 'border-blue-100',   to: '/dashboard/rooms'        },
    { icon: '📅', title: 'Reservas',        desc: 'Gestiona las reservas recibidas',    color: 'from-orange-50 to-amber-100',    border: 'border-orange-100', to: '/dashboard/reservations' },
  ];

  const clientCards = [
    { icon: '🔍', title: 'Explorar',        desc: 'Descubre hoteles rurales',            color: 'from-green-50 to-emerald-100',  border: 'border-green-100',  to: '/'                       },
    { icon: '📅', title: 'Mis reservas',    desc: 'Consulta tus estancias',              color: 'from-blue-50 to-sky-100',        border: 'border-blue-100',   to: '/dashboard/reservations' },
    { icon: '❤️', title: 'Favoritos',       desc: 'Tus alojamientos guardados',          color: 'from-rose-50 to-pink-100',       border: 'border-rose-100',   to: '/'                       },
  ];

  const superCards = [
    { icon: '👥', title: 'Usuarios',          desc: 'Gestión de todos los usuarios',    color: 'from-purple-50 to-violet-100',   border: 'border-purple-100', to: '/dashboard'              },
    { icon: '🏨', title: 'Todos los hoteles', desc: 'Supervisión de alojamientos',      color: 'from-green-50 to-emerald-100',   border: 'border-green-100',  to: '/dashboard/hotels'       },
    { icon: '📊', title: 'Analytics',         desc: 'Métricas y estadísticas globales', color: 'from-orange-50 to-amber-100',    border: 'border-orange-100', to: '/dashboard'              },
  ];

  const cards = isSuperadmin ? superCards : isAdmin ? adminCards : clientCards;

  const roleLabel: Record<string, string> = {
    client:     'Cliente',
    admin:      'Propietario',
    superadmin: 'Superadmin',
  };

  const roleBadge: Record<string, string> = {
    client:     'bg-blue-50 text-blue-700',
    admin:      'bg-green-50 text-green-700',
    superadmin: 'bg-purple-50 text-purple-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-2xl">🏡</span>
            <span className="text-lg font-bold text-green-700 tracking-tight">RuralHot</span>
          </div>
          <div className="flex items-center gap-3">
            {user?.role && (
              <span className={`hidden md:inline-block text-xs font-semibold px-3 py-1 rounded-full ${roleBadge[user.role]}`}>
                {roleLabel[user.role]}
              </span>
            )}
            <span className="hidden md:block text-sm text-gray-500">{user?.email ?? ''}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:shadow-md transition-shadow bg-white"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Salir
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Saludo */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900">
            Bienvenido{user?.name ? `, ${user.name}` : ''} 👋
          </h2>
          <p className="text-gray-400 mt-1 text-sm">
            {isSuperadmin
              ? 'Panel de administración global.'
              : isAdmin
              ? 'Gestiona tus hoteles, habitaciones y reservas.'
              : 'Explora alojamientos y consulta tus reservas.'}
          </p>
        </div>

        {/* Cards ✅ con navegación */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {cards.map(card => (
            <div
              key={card.title}
              onClick={() => navigate(card.to)}
              className={`bg-gradient-to-br ${card.color} border ${card.border} rounded-2xl p-6 hover:shadow-md transition-shadow cursor-pointer group`}
            >
              <div className="text-4xl mb-4">{card.icon}</div>
              <h3 className="font-semibold text-gray-900 text-lg group-hover:text-green-700 transition-colors">{card.title}</h3>
              <p className="text-gray-500 text-sm mt-1">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Banner info */}
        {isClient && (
          <div className="bg-gradient-to-r from-green-700 to-emerald-600 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-4 text-white">
            <div>
              <h3 className="text-xl font-bold mb-1">Descubre el turismo rural</h3>
              <p className="text-green-100 text-sm">Hoteles con encanto, rutas y gastronomía local te esperan.</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="shrink-0 px-6 py-2.5 bg-white text-green-700 font-semibold rounded-full hover:bg-green-50 transition text-sm"
            >
              Explorar hoteles
            </button>
          </div>
        )}
      </div>
    </div>
  );
}