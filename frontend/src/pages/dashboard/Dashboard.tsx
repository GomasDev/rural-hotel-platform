import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ── Tipos ──────────────────────────────────────────────────────────────────────
type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

interface Hotel   { id: string; name: string; isActive: boolean; ownerId: string; }
interface Room    { id: string; name: string; pricePerNight: string; hotelId?: string; hotelName?: string; }
interface Booking {
  id: string; roomId: string; userId: string;
  checkIn: string; checkOut: string;
  guests: number; totalPrice: number;
  status: BookingStatus; createdAt: string;
  room?: { id: string; name: string; hotel?: { id: string; name: string; }; };
  roomName?: string; hotelName?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Pendiente', confirmed: 'Confirmada',
  cancelled: 'Cancelada', completed: 'Completada',
};
const STATUS_COLOR: Record<BookingStatus, string> = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
  completed: 'bg-blue-100 text-blue-700',
};
const fmtDate    = (d: string) => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtMoney   = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const calcNights = (ci: string, co: string) =>
  Math.ceil((new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000);

// ── Skeleton ───────────────────────────────────────────────────────────────────
const Sk = ({ cls }: { cls: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-xl ${cls}`} />
);

// ── Componente principal ───────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const API = import.meta.env.VITE_API_URL;

  const isAdmin      = user?.role === 'admin';
  const isSuperadmin = user?.role === 'super_admin';
  const isClient     = user?.role === 'client';
  const isManager    = isAdmin || isSuperadmin;

  const [hotels,       setHotels]       = useState<Hotel[]>([]);
  const [rooms,        setRooms]        = useState<Room[]>([]);
  const [bookings,     setBookings]     = useState<Booking[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [actionId,     setActionId]     = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');

  // Siempre leer el token dentro de las funciones para evitar stale closures
  const getAuth = () => ({
    Authorization: `Bearer ${sessionStorage.getItem('access_token')}`,
  });

  // ── Carga de datos ────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const auth = getAuth();

      if (isClient) {
        const res  = await fetch(`${API}/bookings`, { headers: auth });
        const data = await res.json();
        setBookings(
          Array.isArray(data)
            ? [...data].sort((a: Booking, b: Booking) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )
            : []
        );
        return;
      }

      // Admin / Superadmin: hoteles → habitaciones → reservas
      const hRes  = await fetch(`${API}/hotels?limit=100`, { headers: auth });
      const hData = await hRes.json();
      const allH: Hotel[] = Array.isArray(hData) ? hData : (hData.data ?? []);

      // Admin ve solo sus hoteles; superadmin ve todos
      const myH = isAdmin ? allH.filter(h => h.ownerId === user?.id) : allH;
      setHotels(myH);

      if (myH.length === 0) {
        setRooms([]);
        setBookings([]);
        return;
      }

      const roomsNested = await Promise.all(
        myH.map(h =>
          fetch(`${API}/rooms/hotel/${h.id}`, { headers: auth })
            .then(r => r.json())
            .then((rs: Room[]) =>
              (Array.isArray(rs) ? rs : []).map(r => ({
                ...r, hotelId: h.id, hotelName: h.name,
              }))
            )
            .catch(() => [] as Room[])
        )
      );
      const allRooms = roomsNested.flat();
      setRooms(allRooms);

      if (allRooms.length === 0) {
        setBookings([]);
        return;
      }

      const bookingsNested = await Promise.all(
        allRooms.map(room =>
          fetch(`${API}/bookings/room/${room.id}`, { headers: auth })
            .then(r => r.json())
            .then((bs: Booking[]) =>
              (Array.isArray(bs) ? bs : []).map(b => ({
                ...b,
                roomName:  room.name,
                hotelName: (room as any).hotelName,
              }))
            )
            .catch(() => [] as Booking[])
        )
      );

      const allBookings = bookingsNested
        .flat()
        .filter((b, i, arr) => arr.findIndex(x => x.id === b.id) === i)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setBookings(allBookings);

    } catch (e) {
      console.error('[Dashboard] Error cargando datos:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => { load(); }, [load]);

  // ── Acciones de estado ────────────────────────────────────────────────────
  const updateStatus = async (id: string, action: 'confirm' | 'complete' | 'cancel') => {
    const msgs: Record<string, string> = {
      confirm:  '¿Confirmar esta reserva?',
      complete: '¿Marcar como completada?',
      cancel:   '¿Cancelar esta reserva? No se puede deshacer.',
    };
    if (!confirm(msgs[action])) return;
    setActionId(id);
    try {
      const res = await fetch(`${API}/bookings/${id}/${action}`, {
        method: 'PATCH', headers: getAuth(),
      });
      if (res.ok) {
        const map: Record<string, BookingStatus> = {
          confirm: 'confirmed', complete: 'completed', cancel: 'cancelled',
        };
        setBookings(prev =>
          prev.map(b => b.id === id ? { ...b, status: map[action] } : b)
        );
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err?.message ?? 'Error al actualizar la reserva');
      }
    } catch (e) {
      console.error('[Dashboard] Error actualizando reserva:', e);
    } finally {
      setActionId(null);
    }
  };

  // ── Estadísticas ──────────────────────────────────────────────────────────
  const revenue   = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + Number(b.totalPrice), 0);
  const pending   = bookings.filter(b => b.status === 'pending').length;
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const completed = bookings.filter(b => b.status === 'completed').length;
  const filtered  = statusFilter === 'all' ? bookings : bookings.filter(b => b.status === statusFilter);

  // ── Navegación rápida ─────────────────────────────────────────────────────
  const adminCards = [
    { icon: '🏨', title: 'Mis hoteles',   desc: 'Gestiona tus alojamientos',          color: 'from-green-50 to-emerald-100', border: 'border-green-100',  to: '/dashboard/hotels'       },
    { icon: '🛏️', title: 'Habitaciones',  desc: 'Configura precios y disponibilidad', color: 'from-blue-50 to-sky-100',       border: 'border-blue-100',   to: '/dashboard/rooms'        },
    { icon: '📅', title: 'Reservas',      desc: 'Gestiona las reservas recibidas',    color: 'from-orange-50 to-amber-100',   border: 'border-orange-100', to: '/dashboard/reservations' },
  ];
  const clientCards = [
    { icon: '🔍', title: 'Explorar',     desc: 'Descubre hoteles rurales',   color: 'from-green-50 to-emerald-100', border: 'border-green-100', to: '/dashboard/hotels'       },
    { icon: '📅', title: 'Mis reservas', desc: 'Consulta tus estancias',     color: 'from-blue-50 to-sky-100',       border: 'border-blue-100',  to: '/dashboard/reservations' },
    { icon: '❤️', title: 'Favoritos',    desc: 'Tus alojamientos guardados', color: 'from-rose-50 to-pink-100',      border: 'border-rose-100',  to: '/dashboard/hotels'       },
  ];
  const superCards = [
    { icon: '👥', title: 'Usuarios',          desc: 'Gestión de todos los usuarios',    color: 'from-purple-50 to-violet-100', border: 'border-purple-100', to: '/dashboard/users'      },
    { icon: '🏨', title: 'Todos los hoteles', desc: 'Supervisión de alojamientos',      color: 'from-green-50 to-emerald-100', border: 'border-green-100',  to: '/dashboard/hotels'     },
    { icon: '📊', title: 'Analytics',         desc: 'Métricas y estadísticas globales', color: 'from-orange-50 to-amber-100',  border: 'border-orange-100', to: '/dashboard/analytics' },
  ];
  const cards = isSuperadmin ? superCards : isAdmin ? adminCards : clientCards;

  const roleLabel: Record<string, string> = { client: 'Cliente', admin: 'Propietario', superadmin: 'Superadmin' };
  const roleBadge: Record<string, string> = {
    client:     'bg-blue-50 text-blue-700',
    admin:      'bg-green-50 text-green-700',
    superadmin: 'bg-purple-50 text-purple-700',
  };

  // ── Render ────────────────────────────────────────────────────────────────
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
            <button onClick={load} title="Actualizar"
              className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </button>
            <button
              onClick={() => { logout(); navigate('/login'); }}
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

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

        {/* Saludo */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Bienvenido{user?.name ? `, ${user.name}` : ''} 👋
          </h2>
          <p className="text-gray-400 mt-1 text-sm">
            {isSuperadmin ? 'Panel de administración global.'
              : isAdmin ? 'Gestiona tus hoteles, habitaciones y reservas.'
              : 'Explora alojamientos y consulta tus reservas.'}
          </p>
        </div>

        {/* KPIs managers */}
        {isManager && (
          loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Sk key={i} cls="h-28" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Hoteles',          value: hotels.length,     icon: '🏨', color: 'from-green-50 to-emerald-100',  border: 'border-green-100',  to: '/dashboard/hotels' },
                { label: 'Habitaciones',     value: rooms.length,      icon: '🛏️', color: 'from-blue-50 to-sky-100',        border: 'border-blue-100',   to: '/dashboard/rooms'  },
                { label: 'Pendientes',       value: pending,           icon: '⏳', color: 'from-amber-50 to-yellow-100',   border: 'border-amber-100',  to: null                },
                { label: 'Ingresos totales', value: fmtMoney(revenue), icon: '💶', color: 'from-purple-50 to-violet-100',  border: 'border-purple-100', to: null                },
              ].map(k => (
                <div key={k.label} onClick={() => k.to && navigate(k.to)}
                  className={`bg-gradient-to-br ${k.color} border ${k.border} rounded-2xl p-5 ${k.to ? 'cursor-pointer hover:shadow-md' : ''} transition-shadow`}>
                  <div className="text-3xl mb-2">{k.icon}</div>
                  <div className="text-2xl font-bold text-gray-900">{k.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
                </div>
              ))}
            </div>
          )
        )}

        {/* KPIs cliente */}
        {isClient && (
          loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Sk key={i} cls="h-28" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Mis reservas', value: bookings.length, icon: '📋', color: 'from-green-50 to-emerald-100',  border: 'border-green-100'  },
                { label: 'Pendientes',   value: pending,          icon: '⏳', color: 'from-amber-50 to-yellow-100',  border: 'border-amber-100'  },
                { label: 'Confirmadas',  value: confirmed,        icon: '✅', color: 'from-blue-50 to-sky-100',       border: 'border-blue-100'   },
                { label: 'Completadas',  value: completed,        icon: '🏁', color: 'from-purple-50 to-violet-100', border: 'border-purple-100' },
              ].map(k => (
                <div key={k.label}
                  className={`bg-gradient-to-br ${k.color} border ${k.border} rounded-2xl p-5 transition-shadow`}>
                  <div className="text-3xl mb-2">{k.icon}</div>
                  <div className="text-2xl font-bold text-gray-900">{k.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Cards de navegación rápida */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cards.map(card => (
            <div key={card.title} onClick={() => navigate(card.to)}
              className={`bg-gradient-to-br ${card.color} border ${card.border} rounded-2xl p-6 hover:shadow-md transition-shadow cursor-pointer group`}>
              <div className="text-4xl mb-4">{card.icon}</div>
              <h3 className="font-semibold text-gray-900 text-lg group-hover:text-green-700 transition-colors">{card.title}</h3>
              <p className="text-gray-500 text-sm mt-1">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Tabla de reservas ─────────────────────────────────────────── */}
        <div>
          {/* Cabecera + filtros */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {isClient ? 'Mis reservas' : 'Reservas de mis hoteles'}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">{bookings.length} en total</p>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {(['all', 'pending', 'confirmed', 'cancelled', 'completed'] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    statusFilter === s
                      ? 'bg-gray-900 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  {s === 'all'
                    ? `Todas (${bookings.length})`
                    : `${STATUS_LABEL[s as BookingStatus]} (${bookings.filter(b => b.status === s).length})`}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Sk key={i} cls="h-20" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <p className="text-5xl mb-3">📋</p>
              <p className="text-gray-500 font-medium">
                {statusFilter === 'all'
                  ? isClient ? 'Todavía no tienes reservas' : 'No hay reservas aún'
                  : `No hay reservas "${STATUS_LABEL[statusFilter as BookingStatus]}"`}
              </p>
              {isClient && statusFilter === 'all' && (
                <button onClick={() => navigate('/dashboard/hotels')}
                  className="mt-4 px-5 py-2 bg-green-700 text-white rounded-full text-sm hover:bg-green-800 transition">
                  Explorar hoteles
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Cabecera tabla */}
              <div className="hidden md:grid grid-cols-[1.5fr_1.5fr_0.6fr_0.7fr_auto_auto] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <span>{isClient ? 'Habitación' : 'Hotel / Habitación'}</span>
                <span>Fechas</span>
                <span>Huésp.</span>
                <span>Total</span>
                <span>Estado</span>
                <span className="text-right">Acciones</span>
              </div>

              <div className="divide-y divide-gray-50">
                {filtered.map(b => (
                  <div key={b.id}
                    className="grid grid-cols-1 md:grid-cols-[1.5fr_1.5fr_0.6fr_0.7fr_auto_auto] gap-2 md:gap-4 items-center px-5 py-4 hover:bg-gray-50/60 transition">

                    {/* Habitación / Hotel */}
                    <div>
                      {!isClient && b.hotelName && (
                        <p className="text-xs font-semibold text-gray-900 truncate">{b.hotelName}</p>
                      )}
                      <p className={`text-sm truncate ${isClient ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                        {b.roomName ?? b.room?.name ?? '—'}
                      </p>
                      {isClient && (b.room?.hotel?.name ?? b.hotelName) && (
                        <p className="text-xs text-gray-400 truncate">{b.room?.hotel?.name ?? b.hotelName}</p>
                      )}
                    </div>

                    {/* Fechas */}
                    <div>
                      <p className="text-sm text-gray-700">{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}</p>
                      <p className="text-xs text-gray-400">
                        {calcNights(b.checkIn, b.checkOut)} noche{calcNights(b.checkIn, b.checkOut) !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Huéspedes */}
                    <p className="text-sm text-gray-600">👤 {b.guests}</p>

                    {/* Total */}
                    <p className="text-sm font-semibold text-gray-900">{fmtMoney(Number(b.totalPrice))}</p>

                    {/* Estado */}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap w-fit ${STATUS_COLOR[b.status]}`}>
                      {STATUS_LABEL[b.status]}
                    </span>

                    {/* Acciones */}
                    <div className="flex items-center gap-1.5 justify-end flex-wrap min-w-[120px]">

                      {/* CONFIRMAR — managers: reservas pending */}
                      {isManager && b.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(b.id, 'confirm')}
                          disabled={actionId === b.id}
                          className="text-xs font-medium text-green-700 border border-green-200 bg-green-50 rounded-full px-3 py-1.5 hover:bg-green-100 disabled:opacity-40 transition whitespace-nowrap"
                        >
                          {actionId === b.id ? '...' : '✅ Confirmar'}
                        </button>
                      )}

                      {/* COMPLETAR — managers: reservas confirmed */}
                      {isManager && b.status === 'confirmed' && (
                        <button
                          onClick={() => updateStatus(b.id, 'complete')}
                          disabled={actionId === b.id}
                          className="text-xs font-medium text-blue-700 border border-blue-200 bg-blue-50 rounded-full px-3 py-1.5 hover:bg-blue-100 disabled:opacity-40 transition whitespace-nowrap"
                        >
                          {actionId === b.id ? '...' : '🏁 Completar'}
                        </button>
                      )}

                      {/* CANCELAR — managers: pending+confirmed | clientes: solo pending */}
                      {(b.status === 'pending' || (isManager && b.status === 'confirmed')) && (
                        <button
                          onClick={() => updateStatus(b.id, 'cancel')}
                          disabled={actionId === b.id}
                          className="text-xs font-medium text-red-500 border border-red-200 bg-red-50 rounded-full px-3 py-1.5 hover:bg-red-100 disabled:opacity-40 transition whitespace-nowrap"
                        >
                          {actionId === b.id ? '...' : '✕ Cancelar'}
                        </button>
                      )}

                      {/* Sin acciones */}
                      {(b.status === 'cancelled' || b.status === 'completed') && !isManager && (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </div>

                  </div>
                ))}
              </div>

              {/* Pie con total */}
              <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-gray-50">
                <span className="text-xs text-gray-400">
                  {filtered.length} reserva{filtered.length !== 1 ? 's' : ''}
                  {statusFilter !== 'all' && ` · ${STATUS_LABEL[statusFilter as BookingStatus]}`}
                </span>
                {statusFilter !== 'cancelled' && (
                  <span className="text-sm font-bold text-gray-900">
                    {fmtMoney(
                      filtered
                        .filter(b => b.status !== 'cancelled')
                        .reduce((s, b) => s + Number(b.totalPrice), 0)
                    )}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Banner cliente */}
        {isClient && (
          <div className="bg-gradient-to-r from-green-700 to-emerald-600 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-4 text-white">
            <div>
              <h3 className="text-xl font-bold mb-1">Descubre el turismo rural</h3>
              <p className="text-green-100 text-sm">Hoteles con encanto, rutas y gastronomía local te esperan.</p>
            </div>
            <button onClick={() => navigate('/dashboard/hotels')}
              className="shrink-0 px-6 py-2.5 bg-white text-green-700 font-semibold rounded-full hover:bg-green-50 transition text-sm">
              Explorar hoteles
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
