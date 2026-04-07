import { useEffect, useState } from 'react';

interface Hotel {
  id: string;
  name: string;
  address: string;
}

interface Room {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  pricePerNight: number;
  images: string[];
  isAvailable: boolean;
  hotelId?: string;
}

export default function Rooms() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string>('all');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API = import.meta.env.VITE_API_URL;

  // Cargar hoteles para el selector
  useEffect(() => {
    fetch(`${API}/hotels?limit=100`)
      .then(res => res.json())
      .then(data => setHotels(data.data ?? data))
      .catch(() => setError('Error al cargar hoteles'))
      .finally(() => setLoadingHotels(false));
  }, []);

  // Cargar habitaciones cuando cambia el hotel seleccionado
  useEffect(() => {
    setLoadingRooms(true);
    setRooms([]);
    setError(null);

    if (selectedHotel === 'all') {
      // Pide todos los hoteles con sus rooms incluidas y las aplana
      fetch(`${API}/hotels?limit=100`)
        .then(res => res.json())
        .then(data => {
          const allHotels = data.data ?? data;
          const allRooms = allHotels.flatMap((h: any) =>
            (h.rooms ?? []).map((r: Room) => ({ ...r, hotelId: h.id }))
          );
          setRooms(allRooms);
        })
        .catch(() => setError('Error al cargar habitaciones'))
        .finally(() => setLoadingRooms(false));
    } else {
      fetch(`${API}/rooms/hotel/${selectedHotel}`)
        .then(res => res.json())
        .then(data => setRooms(data))
        .catch(() => setError('Error al cargar habitaciones'))
        .finally(() => setLoadingRooms(false));
    }
  }, [selectedHotel]);

  if (loadingHotels) return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
          <div className="h-36 bg-gray-200 rounded-xl mb-4" />
          <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {/* ── Cabecera + selector ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Habitaciones</h2>
          <p className="text-gray-500 text-sm mt-1">
            {rooms.length} habitación{rooms.length !== 1 ? 'es' : ''} disponible{rooms.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Selector de hotel */}
        <select
          value={selectedHotel}
          onChange={e => setSelectedHotel(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white md:w-72"
        >
          {/* ✅ Opción "Todos los hoteles" */}
          <option value="all">🏨 Todos los hoteles</option>
          {hotels.map(h => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-4">{error}</p>
      )}

      {/* ── Grid habitaciones ── */}
      {loadingRooms ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="h-36 bg-gray-200 rounded-xl mb-4" />
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🛏️</p>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Sin habitaciones</h3>
          <p className="text-gray-500 text-sm">Este hotel no tiene habitaciones registradas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map(room => (
            <div key={room.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              {/* Imagen */}
              <div className="h-36 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                {room.images?.[0]
                  ? <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover" loading="lazy" />
                  : <span className="text-5xl">🛏️</span>
                }
              </div>

              <div className="p-5">
                {/* Nombre del hotel si estamos en "todos" */}
                {selectedHotel === 'all' && room.hotelId && (
                  <p className="text-xs text-green-600 font-medium mb-1">
                    🏨 {hotels.find(h => h.id === room.hotelId)?.name ?? ''}
                  </p>
                )}

                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 text-lg leading-tight">{room.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ml-2 ${
                    room.isAvailable
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {room.isAvailable ? 'Disponible' : 'Ocupada'}
                  </span>
                </div>

                {room.description && (
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">{room.description}</p>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    👥 {room.capacity} persona{room.capacity !== 1 ? 's' : ''}
                  </span>
                  <span className="text-lg font-bold text-green-700">
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