import { useEffect, useState } from 'react';

interface Hotel { id: string; name: string; address: string; }

interface Room {
  id: string; name: string; description?: string;
  capacity: number; pricePerNight: number;
  images: string[]; isAvailable: boolean; hotelId?: string;
}

export default function Rooms() {
  const [hotels, setHotels]             = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string>('all');
  const [rooms, setRooms]               = useState<Room[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetch(`${API}/hotels?limit=100`)
      .then(res => res.json())
      .then(data => setHotels(data.data ?? data))
      .catch(() => setError('Error al cargar hoteles'))
      .finally(() => setLoadingHotels(false));
  }, []);

  useEffect(() => {
    setLoadingRooms(true); setRooms([]); setError(null);
    if (selectedHotel === 'all') {
      fetch(`${API}/hotels?limit=100`)
        .then(res => res.json())
        .then(async data => {
          const allHotels: Hotel[] = data.data ?? data;
          const results = await Promise.all(
            allHotels.map(h =>
              fetch(`${API}/rooms/hotel/${h.id}`)
                .then(res => res.json())
                .then(rooms => (Array.isArray(rooms) ? rooms : []).map((r: Room) => ({ ...r, hotelId: h.id })))
                .catch(() => [])
            )
          );
          setRooms(results.flat());
        })
        .catch(() => setError('Error al cargar habitaciones'))
        .finally(() => setLoadingRooms(false));
    } else {
      fetch(`${API}/rooms/hotel/${selectedHotel}`)
        .then(res => res.json())
        .then(data => setRooms(Array.isArray(data) ? data : []))
        .catch(() => setError('Error al cargar habitaciones'))
        .finally(() => setLoadingRooms(false));
    }
  }, [selectedHotel]);

  if (loadingHotels) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
          <div className="h-44 bg-gray-200" />
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Habitaciones</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {rooms.length} habitación{rooms.length !== 1 ? 'es' : ''} disponible{rooms.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Selector hotel */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <select value={selectedHotel} onChange={e => setSelectedHotel(e.target.value)}
            className="pl-9 pr-10 py-2.5 border border-gray-200 rounded-full text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white appearance-none md:w-72 cursor-pointer">
            <option value="all">Todos los hoteles</option>
            {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-4 bg-red-50 px-4 py-2 rounded-xl">{error}</p>}

      {/* Grid */}
      {loadingRooms ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
              <div className="h-44 bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-6xl mb-4">🛏️</p>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Sin habitaciones</h3>
          <p className="text-gray-400 text-sm">Este hotel no tiene habitaciones registradas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map(room => (
            <div key={room.id} className="group bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
              {/* Imagen */}
              <div className="relative h-44 bg-gradient-to-br from-blue-100 to-sky-200 overflow-hidden">
                {room.images?.[0]
                  ? <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  : <div className="w-full h-full flex items-center justify-center"><span className="text-6xl">🛏️</span></div>
                }
                <span className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full font-semibold ${room.isAvailable ? 'bg-white text-green-700' : 'bg-white text-red-500'}`}>
                  {room.isAvailable ? 'Disponible' : 'Ocupada'}
                </span>
              </div>

              {/* Info */}
              <div className="p-4">
                {selectedHotel === 'all' && room.hotelId && (
                  <p className="text-xs text-green-600 font-semibold mb-1">
                    🏨 {hotels.find(h => h.id === room.hotelId)?.name ?? ''}
                  </p>
                )}
                <h3 className="font-semibold text-gray-900 mb-1 leading-snug">{room.name}</h3>
                {room.description && <p className="text-xs text-gray-400 mb-3 line-clamp-2">{room.description}</p>}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    {room.capacity} persona{room.capacity !== 1 ? 's' : ''}
                  </span>
                  <span className="font-bold text-gray-900 text-sm">
                    {Number(room.pricePerNight).toFixed(2)} €
                    <span className="text-xs font-normal text-gray-400"> /noche</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}