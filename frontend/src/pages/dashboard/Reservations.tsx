import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Room {
  id: string;
  name: string;
  pricePerNight: string;
  images: string[];
  hotel?: { name: string };
}

interface Booking {
  id: string;
  checkIn: string;
  checkOut: string;
  totalPrice: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  room: Room;
  user?: { name: string; email: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function nightsBetween(checkIn: string, checkOut: string) {
  return Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000);
}

const STATUS_LABEL: Record<string, string> = {
  pending:   'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
};

const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-500 border-red-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
function BookingSkeleton() {
  return (
    <div className="animate-pulse bg-white border border-gray-100 rounded-2xl p-5 flex gap-4">
      <div className="w-24 h-24 bg-gray-200 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-1/4" />
      </div>
    </div>
  );
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function Reservations() {
  const { isAuthenticated, user } = useAuth();
  const navigate                  = useNavigate();
  const API                       = import.meta.env.VITE_API_URL;
  const token                     = sessionStorage.getItem('access_token');

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const [bookings,   setBookings]   = useState<Booking[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [actionId,   setActionId]   = useState<string | null>(null);
  const [filter,     setFilter]     = useState<'all' | Booking['status']>('all');

  useEffect(() => {
    if (!isAuthenticated || !token) { navigate('/login'); return; }

    // Admin ve todas las reservas, cliente solo las suyas
    const endpoint = isAdmin ? `${API}/bookings/all` : `${API}/bookings`;

    fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setBookings(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Acciones ─────────────────────────────────────────────────────────────
  async function patchBooking(id: string, action: 'cancel' | 'confirm' | 'complete') {
    setActionId(id);
    try {
      const res = await fetch(`${API}/bookings/${id}/${action}`, {
        method:  'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const nextStatus: Record<string, Booking['status']> = {
          cancel:   'cancelled',
          confirm:  'confirmed',
          complete: 'completed',
        };
        setBookings(prev =>
          prev.map(b => b.id === id ? { ...b, status: nextStatus[action] } : b)
        );
      }
    } catch {}
    finally { setActionId(null); }
  }

  async function handleCancel(id: string) {
    if (!confirm('¿Cancelar esta reserva?')) return;
    await patchBooking(id, 'cancel');
  }

  async function handleConfirm(id: string) {
    if (!confirm('¿Confirmar esta reserva?')) return;
    await patchBooking(id, 'confirm');
  }

  async function handleComplete(id: string) {
    if (!confirm('¿Marcar como completada?')) return;
    await patchBooking(id, 'complete');
  }

  // ── Filtros ───────────────────────────────────────────────────────────────
  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  const counts = {
    all:       bookings.length,
    pending:   bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? 'Gestión de reservas' : 'Mis reservas'}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {bookings.length} reserva{bookings.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => navigate('/dashboard/rooms')}
            className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-full transition-colors"
          >
            + Nueva reserva
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6" style={{ scrollbarWidth: 'none' }}>
        {([
          { key: 'all',       label: 'Todas'       },
          { key: 'pending',   label: 'Pendientes'  },
          { key: 'confirmed', label: 'Confirmadas' },
          { key: 'completed', label: 'Completadas' },
          { key: 'cancelled', label: 'Canceladas'  },
        ] as { key: typeof filter; label: string }[]).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === f.key
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            {f.label}
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
              filter === f.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {counts[f.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <BookingSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">📅</p>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No hay reservas</h3>
          <p className="text-gray-400 text-sm mb-6">
            {filter === 'all'
              ? 'Aún no hay ninguna reserva.'
              : `No hay reservas con estado "${STATUS_LABEL[filter]}".`}
          </p>
          {filter === 'all' && !isAdmin && (
            <button
              onClick={() => navigate('/dashboard/rooms')}
              className="px-6 py-2.5 bg-green-700 text-white rounded-full text-sm font-semibold hover:bg-green-800 transition"
            >
              Ver habitaciones
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(booking => {
            const nights    = nightsBetween(booking.checkIn, booking.checkOut);
            const isLoading = actionId === booking.id;

            return (
              <div
                key={booking.id}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4 p-5">
                  {/* Imagen */}
                  <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-green-100 to-emerald-200">
                    {booking.room?.images?.[0] ? (
                      <img
                        src={booking.room.images[0]}
                        alt={booking.room.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-3xl">🛏️</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {booking.room?.name ?? '—'}
                        </h3>
                        {/* Admin ve el hotel y el huésped */}
                        {isAdmin && (
                          <p className="text-xs text-gray-400 truncate">
                            {booking.room?.hotel?.name && `🏨 ${booking.room.hotel.name}`}
                            {booking.user?.name && ` · 👤 ${booking.user.name}`}
                          </p>
                        )}
                      </div>
                      <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLOR[booking.status]}`}>
                        {STATUS_LABEL[booking.status]}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 mb-3">
                      <span>📅 {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}</span>
                      <span>🌙 {nights} {nights === 1 ? 'noche' : 'noches'}</span>
                      <span>👥 {booking.guests} {booking.guests === 1 ? 'huésped' : 'huéspedes'}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-gray-900">
                        {parseFloat(booking.totalPrice).toFixed(2)}€
                        <span className="text-xs text-gray-400 font-normal ml-1">total</span>
                      </span>

                      {/* ── Botones de acción ─────────────────────────── */}
                      <div className="flex items-center gap-2 flex-wrap">

                        {/* Admin: confirmar reserva pendiente */}
                        {isAdmin && booking.status === 'pending' && (
                          <button
                            onClick={() => handleConfirm(booking.id)}
                            disabled={isLoading}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white font-semibold
                              px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                          >
                            {isLoading ? '…' : '✅ Confirmar'}
                          </button>
                        )}

                        {/* Admin: completar reserva confirmada */}
                        {isAdmin && booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleComplete(booking.id)}
                            disabled={isLoading}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold
                              px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                          >
                            {isLoading ? '…' : '🏁 Completar'}
                          </button>
                        )}

                        {/* Cancelar: admin en pending/confirmed, cliente en pending/confirmed */}
                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                          <button
                            onClick={() => handleCancel(booking.id)}
                            disabled={isLoading}
                            className="text-xs text-red-500 hover:text-red-700 font-medium
                              disabled:opacity-50 transition-colors"
                          >
                            {isLoading ? 'Procesando…' : 'Cancelar'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-mono">#{booking.id.slice(0, 8).toUpperCase()}</span>
                  <span className="text-xs text-gray-400">Reservado el {formatDate(booking.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}