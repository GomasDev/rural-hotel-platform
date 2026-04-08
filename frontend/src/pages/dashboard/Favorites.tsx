import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../../hooks/useFavorites';
import WeatherWidget from '../../components/WeatherWidget';

type GeoLocation = string | { type: string; coordinates: [number, number] };

interface Room  { id: string; pricePerNight: string; }
interface Hotel {
  id: string; name: string; description?: string; address: string;
  location?: GeoLocation; images: string[]; isActive: boolean; rooms?: Room[];
}

const parseCoords = (loc?: GeoLocation): [number, number] | null => {
  if (!loc) return null;
  if (typeof loc === 'string') {
    const p = loc.split(',').map(s => parseFloat(s.trim()));
    return p.length === 2 && !isNaN(p[0]) && !isNaN(p[1]) ? [p[0], p[1]] : null;
  }
  return loc.coordinates?.length === 2 ? [loc.coordinates[1], loc.coordinates[0]] : null;
};

export default function Favorites() {
  const navigate               = useNavigate();
  const { favorites, toggle, isFav } = useFavorites();
  const [allHotels, setAll]    = useState<Hotel[]>([]);
  const [loading, setLoading]  = useState(true);
  const [weatherOpen, setWO]   = useState<Set<string>>(new Set());

  const toggleWeather = (id: string) =>
    setWO(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/hotels?limit=100`)
      .then(r => r.json())
      .then(d => setAll(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hotels = allHotels.filter(h => isFav(h.id));

  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
          <div className="h-48 bg-gray-200" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mis favoritos</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {hotels.length} alojamiento{hotels.length !== 1 ? 's' : ''} guardado{hotels.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Empty state */}
      {favorites.length === 0 || hotels.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-7xl mb-4">❤️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Aún no tienes favoritos</h3>
          <p className="text-gray-400 text-sm max-w-xs mx-auto mb-6">
            Guarda tus hoteles favoritos para encontrarlos rápidamente.
          </p>
          <button onClick={() => navigate('/dashboard/hotels')}
            className="px-6 py-2.5 bg-green-700 text-white rounded-full text-sm font-semibold hover:bg-green-800 transition">
            Explorar hoteles
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map(hotel => {
            const coords    = parseCoords(hotel.location);
            const precios   = (hotel.rooms ?? []).map(r => parseFloat(r.pricePerNight));
            const precioMin = precios.length > 0 ? Math.min(...precios) : null;

            return (
              <div key={hotel.id} className="group bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                {/* Imagen */}
                <div className="relative h-48 bg-gradient-to-br from-green-100 to-emerald-200 overflow-hidden">
                  {hotel.images?.[0]
                    ? <img src={hotel.images[0]} alt={hotel.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center"><span className="text-6xl">🏡</span></div>
                  }
                  {/* Botón quitar favorito */}
                  <button
                    onClick={() => toggle(hotel.id)}
                    className="absolute top-3 left-3 w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm hover:scale-110 transition-transform"
                    aria-label="Quitar de favoritos"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#e11d48" stroke="#e11d48" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 leading-snug">{hotel.name}</h3>
                    <span className="flex items-center gap-0.5 text-xs text-gray-500 shrink-0">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="#111827"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      4.8
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">📍 {hotel.address}</p>
                  {hotel.description && <p className="text-xs text-gray-400 line-clamp-1 mb-3">{hotel.description}</p>}

                  <div className="flex items-center justify-between mt-2 mb-3">
                    {precioMin !== null ? (
                      <p className="text-sm">
                        <span className="font-bold text-gray-900">{precioMin}€</span>
                        <span className="text-gray-400 text-xs"> /noche</span>
                      </p>
                    ) : <span className="text-xs text-gray-400">Consultar precio</span>}
                  </div>

                  {/* Weather toggle */}
                  {coords && (
                    <div className="border-t border-gray-100 pt-3">
                      <button
                        onClick={() => toggleWeather(hotel.id)}
                        className="flex items-center gap-2 text-xs text-sky-600 hover:text-sky-700 font-medium transition w-full"
                      >
                        <span>🌤️</span>
                        <span>{weatherOpen.has(hotel.id) ? 'Ocultar previsión' : 'Ver previsión del tiempo'}</span>
                        <svg className={`ml-auto w-3 h-3 transition-transform ${weatherOpen.has(hotel.id) ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>
                      {weatherOpen.has(hotel.id) && (
                        <div className="mt-3">
                          <WeatherWidget lat={coords[0]} lng={coords[1]} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}