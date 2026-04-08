import { useEffect, useState } from 'react';
import RoomCalendar from './RoomCalendar';

interface Room {
  id: string;
  name: string;
  pricePerNight: string;
  isAvailable: boolean;
}

interface Booking {
  id: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: string;
  status: string;
  user?: { name?: string; email: string };
}

interface Props {
  rooms: Room[];
}

const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-500 border-red-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmada', cancelled: 'Cancelada', completed: 'Completada',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

export default function AdminOccupancyCalendar({ rooms }: Props) {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(rooms[0] ?? null);
  const [bookings,     setBookings]     = useState<Booking[]>([]);
  const [loading,      setLoading]      = useState(false);
  const API   = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    if (!selectedRoom) return;
    setLoading(true);
    fetch(`${API}/bookings/room/${selectedRoom.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setBookings(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedRoom]);

  const activeBookings = bookings.filter(b => b.status !== 'cancelled');

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 mb-3">Calendario de ocupación</h3>

        {/* Selector de habitación */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {rooms.map(room => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedRoom?.id === room.id
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >
              🛏️ {room.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-0">

        {/* Calendario read-only */}
        <div className="p-5 border-b md:border-b-0 md:border-r border-gray-100">
          {selectedRoom ? (
            <RoomCalendar
              roomId={selectedRoom.id}
              value={null}
              onChange={() => {}}
              readOnly
            />
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">Selecciona una habitación</p>
          )}
        </div>

        {/* Lista de reservas */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">
              Reservas activas
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({activeBookings.length})
              </span>
            </p>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-xl" />
              ))}
            </div>
          ) : activeBookings.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-sm text-gray-400">Sin reservas activas</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {activeBookings.map(b => (
                <div key={b.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-gray-300">#{b.id.slice(0,8).toUpperCase()}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLOR[b.status]}`}>
                      {STATUS_LABEL[b.status]}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 font-medium mb-0.5">
                    {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                    <span className="text-gray-400 ml-2">· {b.guests} {b.guests === 1 ? 'huésped' : 'huéspedes'}</span>
                  </div>
                  {b.user && (
                    <p className="text-xs text-gray-400">{b.user.name ?? b.user.email}</p>
                  )}
                  <p className="text-xs font-bold text-gray-900 mt-1">
                    {parseFloat(b.totalPrice).toFixed(2)}€
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}