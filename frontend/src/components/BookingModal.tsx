import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Room {
  id: string;
  name: string;
  pricePerNight: string;
  capacity: number;
}

interface Props {
  room: Room;
  hotelName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const IconX        = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>;
const IconCalendar = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconCheck    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>;
const IconCard     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IconLock     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;

function toDateInput(d: Date) { return d.toISOString().split('T')[0]; }

function fmtCard(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function fmtExpiry(v: string) {
  const n = v.replace(/\D/g, '').slice(0, 4);
  return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n;
}

type Step = 'form' | 'payment' | 'done';

export default function BookingModal({ room, hotelName, onClose, onSuccess }: Props) {
  const { isAuthenticated } = useAuth();
  const token    = localStorage.getItem('access_token');
  const navigate = useNavigate();
  const API      = import.meta.env.VITE_API_URL;

  const today    = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);

  // ── Step 1: formulario ─────────────────────────────────────────────────────
  const [checkIn,  setCheckIn]  = useState(toDateInput(tomorrow));
  const [checkOut, setCheckOut] = useState(toDateInput(dayAfter));
  const [guests,   setGuests]   = useState(1);

  // ── Step 2: pago ficticio ──────────────────────────────────────────────────
  const [cardNumber, setCardNumber] = useState('');
  const [cardName,   setCardName]   = useState('');
  const [expiry,     setExpiry]     = useState('');
  const [cvv,        setCvv]        = useState('');

  const [step,    setStep]    = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const nights = Math.max(0, Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000
  ));
  const pricePerNight = parseFloat(room.pricePerNight);
  const totalPrice    = (nights * pricePerNight).toFixed(2);

  // ── Avanzar a pago ─────────────────────────────────────────────────────────
  function handleGoToPayment(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!isAuthenticated || !token) { navigate('/login'); return; }
    if (nights <= 0) { setError('La fecha de salida debe ser posterior a la de entrada'); return; }
    if (guests > room.capacity) { setError(`Capacidad máxima: ${room.capacity} personas`); return; }
    setStep('payment');
  }

  // ── Confirmar pago ficticio + crear reserva ────────────────────────────────
  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const rawCard = cardNumber.replace(/\s/g, '');
    if (rawCard.length < 16)   { setError('Número de tarjeta inválido'); return; }
    if (!cardName.trim())       { setError('Introduce el nombre del titular'); return; }
    if (expiry.length < 5)      { setError('Fecha de caducidad inválida'); return; }
    if (cvv.length < 3)         { setError('CVV inválido'); return; }

    setLoading(true);
    try {
      // Simular latencia de pasarela de pago
      await new Promise(r => setTimeout(r, 1200));

      const res = await fetch(`${API}/bookings`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ roomId: room.id, checkIn, checkOut, guests }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? 'Error al crear la reserva');
      }

      setStep('done');
      setTimeout(onSuccess, 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'oklch(0 0 0 / 0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">
              {step === 'form'    && 'Reservar habitación'}
              {step === 'payment' && 'Pago seguro'}
              {step === 'done'    && '¡Reserva confirmada!'}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">{hotelName} · {room.name}</p>
          </div>
          {step !== 'done' && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-400"
            >
              <IconX />
            </button>
          )}
        </div>

        {/* ── STEP DONE ──────────────────────────────────────────────────── */}
        {step === 'done' && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5 text-green-700">
              <IconCheck />
            </div>
            <h3 className="font-bold text-gray-900 text-xl mb-2">¡Pago realizado!</h3>
            <p className="text-gray-400 text-sm mb-1">Tu reserva ha sido confirmada.</p>
            <p className="text-green-700 font-semibold">{totalPrice}€ cobrados</p>
            <p className="text-gray-300 text-xs mt-4">Redirigiendo a tus reservas…</p>
          </div>
        )}

        {/* ── STEP FORM ──────────────────────────────────────────────────── */}
        {step === 'form' && (
          <form onSubmit={handleGoToPayment} className="p-6 space-y-5">

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  <span className="flex items-center gap-1.5"><IconCalendar /> Entrada</span>
                </label>
                <input
                  type="date" value={checkIn} min={toDateInput(tomorrow)} required
                  onChange={e => {
                    setCheckIn(e.target.value);
                    if (e.target.value >= checkOut) {
                      const next = new Date(e.target.value);
                      next.setDate(next.getDate() + 1);
                      setCheckOut(toDateInput(next));
                    }
                  }}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  <span className="flex items-center gap-1.5"><IconCalendar /> Salida</span>
                </label>
                <input
                  type="date" value={checkOut} min={checkIn} required
                  onChange={e => setCheckOut(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                />
              </div>
            </div>

            {/* Huéspedes */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Huéspedes (máx. {room.capacity})
              </label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setGuests(g => Math.max(1, g - 1))}
                  className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-lg font-medium hover:bg-gray-50 transition">−</button>
                <span className="text-lg font-semibold text-gray-900 w-6 text-center">{guests}</span>
                <button type="button" onClick={() => setGuests(g => Math.min(room.capacity, g + 1))}
                  className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-lg font-medium hover:bg-gray-50 transition">+</button>
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>{pricePerNight}€ × {nights} {nights === 1 ? 'noche' : 'noches'}</span>
                <span>{totalPrice}€</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
                <span>Total</span><span>{totalPrice}€</span>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

            <button type="submit" disabled={nights <= 0}
              className="w-full py-3.5 bg-green-700 hover:bg-green-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-2xl transition-colors">
              Ir al pago · {totalPrice}€
            </button>

            {!isAuthenticated && (
              <p className="text-center text-xs text-gray-400">
                Necesitas <button type="button" onClick={() => navigate('/login')} className="underline text-green-700">iniciar sesión</button> para reservar
              </p>
            )}
          </form>
        )}

        {/* ── STEP PAYMENT ───────────────────────────────────────────────── */}
        {step === 'payment' && (
          <form onSubmit={handlePayment} className="p-6 space-y-4">

            {/* Resumen compacto */}
            <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {nights} {nights === 1 ? 'noche' : 'noches'} · {guests} {guests === 1 ? 'huésped' : 'huéspedes'}
              </span>
              <span className="font-bold text-gray-900">{totalPrice}€</span>
            </div>

            {/* Tarjeta — aspecto visual */}
            <div className="relative h-36 rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
              <div className="absolute top-4 left-5 text-white/30 text-4xl font-bold tracking-widest">
                {cardNumber || '•••• •••• •••• ••••'}
              </div>
              <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-0.5">Titular</p>
                  <p className="text-white text-sm font-medium">{cardName || 'NOMBRE APELLIDO'}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-0.5">Caduca</p>
                  <p className="text-white text-sm font-medium">{expiry || 'MM/AA'}</p>
                </div>
              </div>
              <div className="absolute top-4 right-5 flex gap-1">
                <div className="w-7 h-7 rounded-full bg-red-500/80" />
                <div className="w-7 h-7 rounded-full bg-yellow-500/80 -ml-3" />
              </div>
            </div>

            {/* Número tarjeta */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                <span className="flex items-center gap-1.5"><IconCard /> Número de tarjeta</span>
              </label>
              <input
                type="text" inputMode="numeric" placeholder="1234 5678 9012 3456"
                value={cardNumber} maxLength={19}
                onChange={e => setCardNumber(fmtCard(e.target.value))}
                required
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 font-mono tracking-wider"
              />
            </div>

            {/* Nombre titular */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Nombre del titular</label>
              <input
                type="text" placeholder="Como aparece en la tarjeta"
                value={cardName}
                onChange={e => setCardName(e.target.value.toUpperCase())}
                required
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
              />
            </div>

            {/* Caducidad + CVV */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Caducidad</label>
                <input
                  type="text" inputMode="numeric" placeholder="MM/AA"
                  value={expiry} maxLength={5}
                  onChange={e => setExpiry(fmtExpiry(e.target.value))}
                  required
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">CVV</label>
                <input
                  type="password" inputMode="numeric" placeholder="•••"
                  value={cvv} maxLength={4}
                  onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  required
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 font-mono"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-green-700 hover:bg-green-800 disabled:bg-gray-300 text-white font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Procesando pago…</>
                : <><IconLock /> Pagar {totalPrice}€</>}
            </button>

            <button type="button" onClick={() => setStep('form')}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition text-center">
              ← Modificar fechas
            </button>

            <p className="text-center text-xs text-gray-300 flex items-center justify-center gap-1">
              <IconLock /> Pago simulado — ningún dato real es procesado
            </p>
          </form>
        )}
      </div>
    </div>
  );
}