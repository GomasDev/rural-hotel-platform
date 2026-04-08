import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import BookingModal from '../../components/BookingModal'; // ✅ añadido

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Room {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  pricePerNight: string;
  isAvailable: boolean;
  images: string[];
}

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  cuisineType?: string;
  priceRange?: string;
  rating?: number;
  images: string[];
}

interface HikingRoute {
  id: string;
  name: string;
  description?: string;
  difficulty: 'low' | 'medium' | 'high';
  distanceKm: number;
  durationMinutes?: number;
  elevationGainM?: number;
  images: string[];
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

type Tab = 'habitaciones' | 'restaurantes' | 'rutas';

// ── Helpers ───────────────────────────────────────────────────────────────────
const DIFFICULTY_LABEL: Record<string, string> = {
  low: 'Fácil', medium: 'Media', high: 'Difícil',
};
const DIFFICULTY_COLOR: Record<string, string> = {
  low:    'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high:   'bg-red-100 text-red-600',
};
function formatDuration(minutes?: number): string {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ── Iconos ────────────────────────────────────────────────────────────────────
const IconBack     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>;
const IconPin      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconPhone    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 5a2 2 0 0 1 1.93-2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 10.4a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IconMail     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IconStar     = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="#111827" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IconClock    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconPeople   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />;
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function HotelDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const API      = import.meta.env.VITE_API_URL;

  const [hotel,        setHotel]        = useState<Hotel | null>(null);
  const [restaurants,  setRestaurants]  = useState<Restaurant[]>([]);
  const [routes,       setRoutes]       = useState<HikingRoute[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [activeImg,    setActiveImg]    = useState(0);
  const [activeTab,    setActiveTab]    = useState<Tab>('habitaciones');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null); // ✅ añadido

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      fetch(`${API}/hotels/${id}`).then(r => r.json()),
      fetch(`${API}/hotels/${id}/restaurants`).then(r => r.json()),
      fetch(`${API}/hotels/${id}/hiking-routes`).then(r => r.json()),
    ])
      .then(([hotelData, restData, routeData]) => {
        setHotel(hotelData);
        setRestaurants(restData ?? []);
        setRoutes(routeData ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-4">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <div className="grid grid-cols-3 gap-4 pt-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    </div>
  );

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!hotel) return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-6xl">🏡</p>
        <h2 className="text-xl font-semibold text-gray-800">Hotel no encontrado</h2>
        <button onClick={() => navigate('/')} className="text-sm text-green-700 underline">
          Volver al inicio
        </button>
      </div>
    </div>
  );

  const images   = hotel.images?.length ? hotel.images : [];
  const rooms    = hotel.rooms ?? [];
  const minPrice = rooms.length
    ? Math.min(...rooms.map(r => parseFloat(r.pricePerNight)))
    : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Botón volver */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition mb-6"
        >
          <IconBack /> Volver
        </button>

        {/* ═══ GALERÍA ════════════════════════════════════════════════════════ */}
        {images.length > 0 ? (
          <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-80 mb-8">
            <div className="col-span-2 row-span-2 relative overflow-hidden">
              <img
                src={images[activeImg] ?? images[0]}
                alt={hotel.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            {images.slice(1, 5).map((img, i) => (
              <div
                key={i}
                onClick={() => setActiveImg(i + 1)}
                className={`relative overflow-hidden cursor-pointer ${
                  activeImg === i + 1 ? 'ring-2 ring-green-500 ring-inset' : ''
                }`}
              >
                <img
                  src={img}
                  alt={`${hotel.name} ${i + 2}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
            {Array.from({ length: Math.max(0, 4 - (images.length - 1)) }).map((_, i) => (
              <div key={`ph-${i}`} className="bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center">
                <span className="text-4xl opacity-40">🏡</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-72 bg-gradient-to-br from-green-100 to-emerald-200 rounded-2xl flex items-center justify-center mb-8">
            <span className="text-8xl">🏡</span>
          </div>
        )}

        {/* ═══ HEADER INFO ════════════════════════════════════════════════════ */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{hotel.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
              <span className="flex items-center gap-1.5"><IconPin /> {hotel.address}</span>
              {hotel.phone && <span className="flex items-center gap-1.5"><IconPhone /> {hotel.phone}</span>}
              {hotel.email && <span className="flex items-center gap-1.5"><IconMail /> {hotel.email}</span>}
            </div>
            {hotel.description && (
              <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">{hotel.description}</p>
            )}
          </div>

          {/* Precio + CTA */}
          <div className="shrink-0 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-center min-w-[180px]">
            {minPrice !== null ? (
              <>
                <p className="text-xs text-gray-400 mb-1">Desde</p>
                <p className="text-3xl font-bold text-gray-900">{minPrice}€</p>
                <p className="text-xs text-gray-400 mb-4">/noche</p>
              </>
            ) : (
              <p className="text-sm text-gray-400 mb-4">Consultar precio</p>
            )}
            {/* ✅ Abre el modal con la habitación más barata disponible */}
            <button
              onClick={() => {
                const available = rooms.find(r => r.isAvailable);
                if (available) setSelectedRoom(available);
              }}
              disabled={!rooms.some(r => r.isAvailable)}
              className="w-full px-4 py-2.5 bg-green-700 hover:bg-green-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Reservar ahora
            </button>
            <p className="text-xs text-gray-400 mt-2">Sin cargos adicionales</p>
          </div>
        </div>

        {/* ═══ TABS ════════════════════════════════════════════════════════════ */}
        <div className="border-b border-gray-100 mb-8">
          <div className="flex gap-1">
            {([
              { key: 'habitaciones', label: 'Habitaciones', icon: '🛏️', count: rooms.length },
              { key: 'restaurantes', label: 'Restaurantes',  icon: '🍽️', count: restaurants.length },
              { key: 'rutas',        label: 'Rutas',         icon: '⛰️', count: routes.length },
            ] as { key: Tab; label: string; icon: string; count: number }[]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === tab.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ═══ HABITACIONES ════════════════════════════════════════════════════ */}
        {activeTab === 'habitaciones' && (
          <div className="space-y-4">
            {rooms.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-3">🛏️</p>
                <p className="text-gray-500 font-medium">No hay habitaciones disponibles</p>
              </div>
            ) : rooms.map(room => (
              <div
                key={room.id}
                className="flex flex-col md:flex-row gap-5 border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="md:w-56 h-44 md:h-auto shrink-0 bg-gradient-to-br from-green-100 to-emerald-200 overflow-hidden">
                  {room.images?.[0] ? (
                    <img src={room.images[0]} alt={room.name} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-5xl">🛏️</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">{room.name}</h3>
                      <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        room.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {room.isAvailable ? 'Disponible' : 'Ocupada'}
                      </span>
                    </div>
                    {room.description && (
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2">{room.description}</p>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                      <IconPeople /> {room.capacity} {room.capacity === 1 ? 'persona' : 'personas'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div>
                      <span className="text-2xl font-bold text-gray-900">
                        {parseFloat(room.pricePerNight).toFixed(0)}€
                      </span>
                      <span className="text-xs text-gray-400 ml-1">/noche</span>
                    </div>
                    {/* ✅ Abre el modal con esta habitación */}
                    <button
                      onClick={() => setSelectedRoom(room)}
                      disabled={!room.isAvailable}
                      className="px-5 py-2 bg-green-700 hover:bg-green-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      Reservar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ RESTAURANTES ════════════════════════════════════════════════════ */}
        {activeTab === 'restaurantes' && (
          <div>
            {restaurants.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-3">🍽️</p>
                <p className="text-gray-500 font-medium">No hay restaurantes asociados</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {restaurants.map(rest => (
                  <div key={rest.id} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                    <div className="h-40 overflow-hidden bg-gradient-to-br from-orange-100 to-amber-100">
                      {rest.images?.[0] ? (
                        <img src={rest.images[0]} alt={rest.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-6xl">🍽️</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-gray-900">{rest.name}</h3>
                        {rest.rating && (
                          <span className="flex items-center gap-0.5 text-xs font-semibold text-gray-700 shrink-0 ml-2">
                            <IconStar /> {rest.rating}
                          </span>
                        )}
                      </div>
                      {rest.description && (
                        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{rest.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100">
                        <span className="text-gray-500">{rest.cuisineType ?? '—'}</span>
                        {rest.priceRange && <span className="font-semibold text-gray-800">{rest.priceRange}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ RUTAS ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'rutas' && (
          <div>
            {routes.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-3">⛰️</p>
                <p className="text-gray-500 font-medium">No hay rutas asociadas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {routes.map(route => (
                  <div key={route.id} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative h-40 overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-200">
                      {route.images?.[0] ? (
                        <img src={route.images[0]} alt={route.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-6xl">⛰️</span>
                        </div>
                      )}
                      <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${DIFFICULTY_COLOR[route.difficulty]}`}>
                        {DIFFICULTY_LABEL[route.difficulty]}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 leading-snug">{route.name}</h3>
                      {route.description && (
                        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{route.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                        <span className="flex items-center gap-1.5"><IconClock /> {formatDuration(route.durationMinutes)}</span>
                        <span>{route.distanceKm} km</span>
                        {route.elevationGainM && <span>↑ {route.elevationGainM}m</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ═══ FOOTER ══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-gray-100 mt-16">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏡</span>
            <span className="font-semibold text-gray-700">RuralHot</span>
          </div>
          <span>© {new Date().getFullYear()} RuralHot — Turismo rural auténtico</span>
        </div>
      </footer>

      {/* ✅ Modal de reserva */}
      {selectedRoom && hotel && (
        <BookingModal
          room={selectedRoom}
          hotelName={hotel.name}
          onClose={() => setSelectedRoom(null)}
          onSuccess={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
}