import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useFavorites } from '../../hooks/useFavorites';

// ── Tipos ────────────────────────────────────────────────────────────────────
interface Room {
  id: string;
  name: string;
  capacity: number;
  pricePerNight: string;
  isAvailable: boolean;
}

interface Hotel {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone?: string;
  email?: string;
  images: string[];
  isActive: boolean;
  rooms?: Room[];
}

type Category = 'hoteles' | 'rutas' | 'restaurantes';

// ── Datos placeholder ─────────────────────────────────────────────────────────
const TRAIL_PLACEHOLDERS = [
  { id: 1, name: 'Ruta del Hayedo de Montejo', difficulty: 'Fácil',   duration: '2h', distance: '6 km',  region: 'Sierra Norte, Madrid' },
  { id: 2, name: 'Pico Peñalara',              difficulty: 'Difícil', duration: '5h', distance: '12 km', region: 'Guadarrama, Madrid'   },
  { id: 3, name: 'Cascada del Purgatorio',     difficulty: 'Media',   duration: '3h', distance: '8 km',  region: 'Rascafría, Madrid'    },
];

const RESTAURANT_PLACEHOLDERS = [
  { id: 1, name: 'El Asador de la Sierra', cuisine: 'Cocina castellana', rating: 4.8, price: '€€',  region: 'Cercedilla'  },
  { id: 2, name: 'La Taberna del Monte',   cuisine: 'Tapas y raciones',  rating: 4.5, price: '€',   region: 'Miraflores'  },
  { id: 3, name: 'Casa Rural El Roble',    cuisine: 'Caza y setas',      rating: 4.9, price: '€€€', region: 'Bustarviejo' },
];

const DIFFICULTY_COLOR: Record<string, string> = {
  'Fácil':   'bg-green-100 text-green-700',
  'Media':   'bg-yellow-100 text-yellow-700',
  'Difícil': 'bg-red-100 text-red-600',
};

// ── Iconos SVG inline ─────────────────────────────────────────────────────────
const IconSearch   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 shrink-0"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
const IconCalendar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 shrink-0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconPeople   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 shrink-0"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconStar     = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="#111827" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IconClock    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconDistance = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3"/></svg>;

const IconHeart = ({ filled }: { filled: boolean }) => (
  <svg width="15" height="15" viewBox="0 0 24 24"
    fill={filled ? '#e11d48' : 'none'}
    stroke={filled ? '#e11d48' : '#6b7280'}
    strokeWidth="2"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

// ── Componente principal ──────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate                        = useNavigate();
  const { toggle: toggleFav, isFav }    = useFavorites();
  const [hotels, setHotels]             = useState<Hotel[]>([]);
  const [loadingHotels, setLoading]     = useState(true);
  const [activeCategory, setActive]     = useState<Category>('hoteles');
  const [searchInput, setSearchInput]   = useState('');

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/hotels`)
      .then(res => res.json())
      .then(data => setHotels(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-4 py-28"
        style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)' }}
      >
        {/* Orbes decorativos */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -left-10 w-72 h-72 bg-green-200 rounded-full opacity-20 blur-3xl" />
          <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-emerald-300 rounded-full opacity-20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white rounded-full opacity-10 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Pill badge */}
          <span className="inline-flex items-center gap-2 bg-white text-green-700 text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm mb-6 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Turismo rural auténtico
          </span>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-5 leading-tight">
            Tu escapada rural<br />
            <span className="text-green-700">perfecta te espera</span>
          </h1>

          <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
            Hoteles con encanto, rutas de senderismo y restaurantes de cocina local.
            Todo en un mismo lugar.
          </p>

          {/* Buscador estilo Airbnb */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center bg-white rounded-2xl md:rounded-full shadow-lg border border-gray-100 overflow-hidden max-w-2xl mx-auto">
            {/* Destino */}
            <div className="flex-1 flex items-center gap-3 px-5 py-3.5 md:border-r border-gray-100">
              <IconSearch />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="¿A dónde quieres ir?"
                className="w-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
              />
            </div>
            {/* Fechas */}
            <div className="hidden md:flex items-center gap-3 px-5 py-3.5 border-r border-gray-100 cursor-pointer group hover:bg-gray-50 transition">
              <IconCalendar />
              <span className="text-sm text-gray-400 group-hover:text-gray-600 transition">Fechas</span>
            </div>
            {/* Viajeros */}
            <div className="hidden md:flex items-center gap-3 px-5 py-3.5 cursor-pointer group hover:bg-gray-50 transition">
              <IconPeople />
              <span className="text-sm text-gray-400 group-hover:text-gray-600 transition">Viajeros</span>
            </div>
            {/* Botón buscar */}
            <button
              onClick={() => navigate('/register')}
              className="m-1.5 md:m-2 px-6 py-3 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-full transition-colors shrink-0"
            >
              Buscar
            </button>
          </div>

          {/* Stats rápidas */}
          <div className="flex items-center justify-center gap-8 mt-10 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏨</span>
              <span><strong className="text-gray-800">{hotels.length}+</strong> hoteles</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-xl">⛰️</span>
              <span><strong className="text-gray-800">50+</strong> rutas</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-xl">🍽️</span>
              <span><strong className="text-gray-800">30+</strong> restaurantes</span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          TABS DE CATEGORÍA (sticky)
      ════════════════════════════════════════ */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {([
              { key: 'hoteles',      label: 'Hoteles rurales',     icon: '🏨' },
              { key: 'rutas',        label: 'Rutas de senderismo', icon: '⛰️' },
              { key: 'restaurantes', label: 'Restaurantes',        icon: '🍽️' },
            ] as { key: Category; label: string; icon: string }[]).map(cat => (
              <button
                key={cat.key}
                onClick={() => setActive(cat.key)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeCategory === cat.key
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          SECCIÓN HOTELES
      ════════════════════════════════════════ */}
      {activeCategory === 'hoteles' && (
        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Hoteles rurales</h2>
              <p className="text-gray-400 text-sm mt-1">
                {loadingHotels ? 'Cargando...' : `${hotels.length} alojamientos disponibles`}
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-gray-700 underline underline-offset-2 hover:text-green-700 transition"
            >
              Ver todos →
            </button>
          </div>

          {/* Skeleton loading */}
          {loadingHotels ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-52 bg-gray-200 rounded-2xl mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1.5" />
                  <div className="h-3 bg-gray-100 rounded w-1/2 mb-1.5" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </div>
              ))}
            </div>

          ) : hotels.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-6xl mb-4">🏡</p>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No hay hoteles disponibles aún</h3>
              <p className="text-gray-400 text-sm mb-6">Vuelve pronto para descubrir nuevos alojamientos.</p>
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-2.5 bg-green-700 text-white rounded-full text-sm font-semibold hover:bg-green-800 transition"
              >
                Registra tu hotel
              </button>
            </div>

          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {hotels.map(hotel => {
                const precios   = (hotel.rooms ?? []).map(r => parseFloat(r.pricePerNight));
                const precioMin = precios.length > 0 ? Math.min(...precios) : null;
                const numRooms  = hotel.rooms?.length ?? 0;

                return (
                  <div
                    key={hotel.id}
                    onClick={() => navigate('/login')}
                    className="group cursor-pointer"
                  >
                    {/* Imagen */}
                    <div className="relative h-52 bg-gradient-to-br from-green-100 to-emerald-200 rounded-2xl overflow-hidden mb-3">
                      {hotel.images?.[0] ? (
                        <img
                          src={hotel.images[0]}
                          alt={hotel.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-6xl">🏡</span>
                        </div>
                      )}

                      {/* Badge nº habitaciones */}
                      {numRooms > 0 && (
                        <span className="absolute top-3 left-3 bg-white/95 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                          🛏️ {numRooms} hab.
                        </span>
                      )}

                      {/* Botón favorito */}
                      <button
                        onClick={e => { e.stopPropagation(); toggleFav(hotel.id); }}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-sm hover:scale-110 transition-all"
                        aria-label={isFav(hotel.id) ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                      >
                        <IconHeart filled={isFav(hotel.id)} />
                      </button>
                    </div>

                    {/* Info */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{hotel.name}</h3>
                        <span className="flex items-center gap-0.5 text-xs text-gray-600 shrink-0 font-medium">
                          <IconStar /> 4.8
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs flex items-center gap-1 mb-1">
                        📍 {hotel.address}
                      </p>
                      {hotel.description && (
                        <p className="text-gray-400 text-xs line-clamp-1 mb-1.5">{hotel.description}</p>
                      )}
                      <p className="text-sm mt-1.5">
                        {precioMin !== null ? (
                          <>
                            <span className="font-semibold text-gray-900">{precioMin}€</span>
                            <span className="text-gray-400 text-xs"> /noche</span>
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs">Consultar precio</span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ════════════════════════════════════════
          SECCIÓN RUTAS
      ════════════════════════════════════════ */}
      {activeCategory === 'rutas' && (
        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Rutas de senderismo</h2>
              <p className="text-gray-400 text-sm mt-1">Explora la naturaleza a tu ritmo</p>
            </div>
            <span className="text-xs bg-amber-50 text-amber-600 font-semibold px-3 py-1.5 rounded-full border border-amber-100">
              🚧 Próximamente
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TRAIL_PLACEHOLDERS.map(trail => (
              <div
                key={trail.id}
                className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              >
                {/* Imagen placeholder */}
                <div className="relative h-44 bg-gradient-to-br from-emerald-100 via-green-200 to-teal-200 flex items-center justify-center overflow-hidden">
                  <span className="text-7xl group-hover:scale-110 transition-transform duration-300">⛰️</span>
                  <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${DIFFICULTY_COLOR[trail.difficulty]}`}>
                    {trail.difficulty}
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 leading-snug">{trail.name}</h3>
                  <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                    📍 {trail.region}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                    <span className="flex items-center gap-1.5">
                      <IconClock /> {trail.duration}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <IconDistance /> {trail.distance}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Aviso próximamente */}
          <div className="mt-10 text-center py-10 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-green-100">
            <p className="text-3xl mb-3">🥾</p>
            <h3 className="font-semibold text-gray-800 mb-1">Base de datos de rutas en construcción</h3>
            <p className="text-gray-400 text-sm">Pronto podrás explorar rutas reales con mapas y fotos del recorrido.</p>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════
          SECCIÓN RESTAURANTES
      ════════════════════════════════════════ */}
      {activeCategory === 'restaurantes' && (
        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Restaurantes rurales</h2>
              <p className="text-gray-400 text-sm mt-1">Gastronomía local y cocina de temporada</p>
            </div>
            <span className="text-xs bg-amber-50 text-amber-600 font-semibold px-3 py-1.5 rounded-full border border-amber-100">
              🚧 Próximamente
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {RESTAURANT_PLACEHOLDERS.map(rest => (
              <div
                key={rest.id}
                className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="relative h-44 bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-100 flex items-center justify-center overflow-hidden">
                  <span className="text-7xl group-hover:scale-110 transition-transform duration-300">🍽️</span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 leading-snug">{rest.name}</h3>
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-gray-700 shrink-0 ml-2">
                      <IconStar /> {rest.rating}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                    📍 {rest.region}
                  </p>
                  <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100">
                    <span className="text-gray-500">{rest.cuisine}</span>
                    <span className="font-semibold text-gray-800">{rest.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Aviso próximamente */}
          <div className="mt-10 text-center py-10 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-amber-100">
            <p className="text-3xl mb-3">🧑‍🍳</p>
            <h3 className="font-semibold text-gray-800 mb-1">Restaurantes en construcción</h3>
            <p className="text-gray-400 text-sm">Pronto podrás reservar mesa directamente desde la plataforma.</p>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════
          BANNER CTA — ¿Tienes un hotel?
      ════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="relative overflow-hidden bg-gradient-to-r from-green-700 to-emerald-600 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
          {/* Orbe decorativo */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-white rounded-full opacity-5" />
          <div className="absolute -left-8 -bottom-8 w-48 h-48 bg-emerald-400 rounded-full opacity-20" />

          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-2">¿Tienes un hotel rural?</h3>
            <p className="text-green-100 text-sm max-w-md leading-relaxed">
              Únete a nuestra plataforma y llega a miles de viajeros que buscan
              experiencias auténticas en la naturaleza.
            </p>
          </div>
          <button
            onClick={() => navigate('/register')}
            className="relative z-10 shrink-0 px-8 py-3 bg-white text-green-700 font-semibold rounded-full hover:bg-green-50 transition-colors text-sm shadow-sm"
          >
            Registra tu alojamiento →
          </button>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏡</span>
              <span className="font-semibold text-gray-700">RuralHot</span>
            </div>
            <span>© {new Date().getFullYear()} RuralHot — Turismo rural auténtico</span>
            <div className="flex gap-6">
              <button className="hover:text-gray-700 transition">Privacidad</button>
              <button className="hover:text-gray-700 transition">Términos</button>
              <button className="hover:text-gray-700 transition">Contacto</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}