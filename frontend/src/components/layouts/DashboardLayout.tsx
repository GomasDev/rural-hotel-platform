import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

type MenuItem = { icon: string; name: string; path: string };

const MENU_SUPER: MenuItem[] = [
  { icon: '🏠', name: 'Inicio',          path: '/dashboard'         },
  { icon: '📊', name: 'Resumen',          path: '/dashboard/analytics'      },
  { icon: '👥', name: 'Usuarios',         path: '/dashboard/users'      },
  { icon: '🏨', name: 'Todos los hoteles',path: '/dashboard/hotels' },
];

const MENU_ADMIN: MenuItem[] = [
  { icon: '🏠', name: 'Inicio',          path: '/dashboard'         },
  { icon: '📊', name: 'Resumen',          path: '/dashboard/analytics'         },
  { icon: '🏨', name: 'Hoteles',          path: '/dashboard/hotels'        },
  { icon: '🛏️', name: 'Habitaciones',     path: '/dashboard/rooms'         },
  { icon: '📅', name: 'Reservas',         path: '/dashboard/reservations'  },
  { icon: '🥾', name: 'Rutas senderismo', path: '/dashboard/hiking-routes' },
  { icon: '🎯', name: 'Actividades',      path: '/dashboard/activities'    },
];

const MENU_CLIENT: MenuItem[] = [
  { icon: '🏠', name: 'Inicio',          path: '/dashboard'         },
  { icon: '📅', name: 'Mis reservas',     path: '/dashboard/reservations' },
  { icon: '🏨', name: 'Hoteles',          path: '/dashboard/hotels'        },
  {icon: '🛏️', name: 'Habitaciones',     path: '/dashboard/rooms'         },
  { icon: '🥾', name: 'Rutas senderismo', path: '/dashboard/hiking-routes' },
  { icon: '🎯', name: 'Actividades',      path: '/dashboard/activities'    },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin:       'Administrador',
  client:      'Cliente',
};

export default function DashboardLayout() {
  const navigate       = useNavigate();
  const location       = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menu: MenuItem[] =
    user?.role === 'super_admin' ? MENU_SUPER  :
    user?.role === 'admin'       ? MENU_ADMIN  :
                                   MENU_CLIENT;

  const isActive = (path: string) =>
    path.endsWith('/super')  || path.endsWith('/admin') || path.endsWith('/client')
      ? location.pathname === path
      : location.pathname.startsWith(path);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl flex flex-col
        transform transition-transform lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo + usuario */}
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-green-700">🏔️ RuralHot</h1>

          {user && (
            <div className="mt-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center
                              text-green-700 font-bold text-sm shrink-0">
                {user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium
                  bg-green-100 text-green-700">
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menu.map(item => (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setIsOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                transition-all ${
                  isActive(item.path)
                    ? 'bg-green-50 text-green-700 font-semibold'
                    : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1 text-left">{item.name}</span>
              {isActive(item.path) && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-600 shrink-0" />
              )}
            </button>
          ))}
        </nav>

        {/* Cerrar sesión */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
              text-red-600 hover:bg-red-50 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── Contenido principal ──────────────────────────────── */}
      <div className="lg:ml-64 flex flex-col min-h-screen">

        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">

            {/* Hamburger mobile */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              aria-label="Abrir menú"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>

            {/* Info usuario (header derecha) */}
            <div className="flex items-center gap-3 ml-auto">
              <span className="hidden sm:inline-block text-sm text-gray-500">
                {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
              </span>
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center
                              text-green-700 font-bold text-sm shrink-0">
                {user?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700
                  text-sm font-medium transition-all"
              >
                Salir
              </button>
            </div>
          </div>
        </header>

        {/* Página actual */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
