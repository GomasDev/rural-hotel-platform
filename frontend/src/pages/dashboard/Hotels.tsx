import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../hooks/useFavorites';
import WeatherWidget from '../../components/WeatherWidget';
import AdminOccupancyCalendar from '../../components/AdminOccupancyCalendar';
import HotelRooms from './HotelRooms';

type GeoLocation = string | { type: string; coordinates: [number, number] };

interface Hotel {
  id: string; name: string; description?: string; address: string;
  location?: GeoLocation; phone?: string; email?: string;
  images: string[]; isActive: boolean; ownerId: string;
}

interface Room {
  id: string; name: string; capacity: number;
  pricePerNight: string; isAvailable: boolean; images: string[];
}

interface HotelsResponse {
  data: Hotel[]; total: number; page: number; limit: number; totalPages: number;
}

const EMPTY_FORM = {
  name: '', description: '', address: '', location: '',
  phone: '', email: '', images: [] as string[], isActive: true,
};

type Tab = 'explore' | 'manage';

const formatLocation = (loc?: GeoLocation): string => {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  return `${loc.coordinates[1]}, ${loc.coordinates[0]}`;
};

const parseCoords = (loc?: GeoLocation): [number, number] | null => {
  if (!loc) return null;
  if (typeof loc === 'string') {
    const p = loc.split(',').map(s => parseFloat(s.trim()));
    return p.length === 2 && !isNaN(p[0]) && !isNaN(p[1]) ? [p[0], p[1]] : null;
  }
  return loc.coordinates?.length === 2 ? [loc.coordinates[1], loc.coordinates[0]] : null;
};

export default function Hotels() {
  const { user } = useAuth();
  const isClient = user?.role === 'client';
  const isAdmin  = user?.role === 'admin';

  const { toggle: toggleFav, isFav } = useFavorites();

  const [tab, setTab]                 = useState<Tab>('explore');
  const [response, setResponse]       = useState<HotelsResponse | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage]               = useState(1);
  const [sortBy, setSortBy]           = useState('createdAt_desc');
  const [refreshKey, setRefreshKey]   = useState(0);
  const LIMIT = 9;

  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<Hotel | null>(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');
  const [imageInput, setImageInput] = useState('');
  const [roomsModal, setRoomsModal] = useState<{ open: boolean; hotel?: Hotel }>({ open: false });

  // ── Calendario de ocupación ────────────────────────────────────────────────
  const [calModal, setCalModal] = useState<{ open: boolean; hotel?: Hotel; rooms: Room[] }>({ open: false, rooms: [] });
  const [calLoading, setCalLoading] = useState(false);

  const openCalendar = async (hotel: Hotel) => {
    setCalModal({ open: true, hotel, rooms: [] });
    setCalLoading(true);
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/rooms/hotel/${hotel.id}`);
      const data = await res.json();
      setCalModal({ open: true, hotel, rooms: Array.isArray(data) ? data : [] });
    } catch {}
    finally { setCalLoading(false); }
  };
  // ──────────────────────────────────────────────────────────────────────────

  const [weatherOpen, setWeatherOpen] = useState<Set<string>>(new Set());
  const toggleWeather = (id: string) =>
    setWeatherOpen(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const token = sessionStorage.getItem('access_token');

  useEffect(() => {
    setLoading(true); setError(null);
    const [field, ord] = sortBy.split('_');
    const params = new URLSearchParams({
      page: String(page), limit: String(LIMIT), search,
      sortBy: field, order: ord.toUpperCase(),
    });
    fetch(`${import.meta.env.VITE_API_URL}/hotels?${params}`)
      .then(res => { if (!res.ok) throw new Error('Error al cargar hoteles'); return res.json(); })
      .then(data => setResponse(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, search, sortBy, refreshKey]);

  useEffect(() => { setPage(1); setSearch(''); setSearchInput(''); }, [tab]);

  const triggerRefresh   = () => setRefreshKey(k => k + 1);
  const handleSearch     = (e: React.FormEvent) => { e.preventDefault(); setPage(1); setSearch(searchInput); };
  const handleClear      = () => { setSearchInput(''); setSearch(''); setPage(1); };
  const handleSortChange = (value: string) => { setSortBy(value); setPage(1); };

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setImageInput(''); setFormError(''); setModalOpen(true); };
  const openEdit   = (hotel: Hotel) => {
    setEditing(hotel);
    setForm({ name: hotel.name, description: hotel.description ?? '', address: hotel.address,
      location: formatLocation(hotel.location), phone: hotel.phone ?? '',
      email: hotel.email ?? '', images: hotel.images ?? [], isActive: hotel.isActive });
    setImageInput(''); setFormError(''); setModalOpen(true);
  };
  const openRooms  = (hotel: Hotel) => setRoomsModal({ open: true, hotel });

  const addImage    = () => {
    const url = imageInput.trim();
    if (!url) return;
    if (!/^https?:\/\/.+/.test(url)) { setFormError('La URL debe comenzar por http:// o https://'); return; }
    setForm(f => ({ ...f, images: [...f.images, url] }));
    setImageInput(''); setFormError('');
  };
  const removeImage = (index: number) => setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));

  const handleSave = async () => {
    if (!form.name || !form.address) { setFormError('Nombre y dirección son obligatorios'); return; }
    setSaving(true); setFormError('');
    const url    = editing ? `${import.meta.env.VITE_API_URL}/hotels/${editing.id}` : `${import.meta.env.VITE_API_URL}/hotels`;
    const method = editing ? 'PATCH' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message ?? 'Error al guardar'); }
      setModalOpen(false); triggerRefresh();
    } catch (e: any) { setFormError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (hotel: Hotel) => {
    if (!confirm(`¿Eliminar "${hotel.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/hotels/${hotel.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Error al eliminar');
      triggerRefresh();
    } catch (e: any) { alert(e.message); }
  };

  const hotels = (response?.data ?? []).filter(h => {
    if (tab === 'explore') return true;
    if (isAdmin)           return h.ownerId === user?.id;
    return true;
  });

  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
          <div className="h-48 bg-gray-200" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  if (error) return (
    <div className="text-center py-20">
      <p className="text-5xl mb-4">⚠️</p>
      <p className="text-red-500 font-medium">{error}</p>
    </div>
  );

  return (
    <>
      <div>
        {/* Tabs */}
        {!isClient && (
          <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
            {([['explore', '🌍 Explorar'], ['manage', isAdmin ? '🏨 Mis hoteles' : '⚙️ Gestión']] as [Tab, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Cabecera */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {tab === 'explore' ? 'Todos los hoteles' : isAdmin ? 'Mis hoteles' : 'Gestión de hoteles'}
            </h2>
            <p className="text-gray-400 text-sm mt-0.5">
              {hotels.length} hotel{hotels.length !== 1 ? 'es' : ''}
              {tab === 'manage' && isAdmin && <span className="ml-1 text-green-600">creados por ti</span>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-0">
              <div className="relative flex-1 md:w-56">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                  placeholder="Buscar hotel..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
              </div>
              <button type="submit" className="px-4 py-2 bg-green-700 text-white rounded-full text-sm font-medium hover:bg-green-800 transition">Buscar</button>
              {search && (
                <button type="button" onClick={handleClear} className="px-4 py-2 border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition">Limpiar</button>
              )}
            </form>

            <select value={sortBy} onChange={e => handleSortChange(e.target.value)}
              className="border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
              <option value="createdAt_desc">Más recientes</option>
              <option value="createdAt_asc">Más antiguos</option>
              <option value="name_asc">A → Z</option>
              <option value="name_desc">Z → A</option>
            </select>

            {tab === 'manage' && (
              <button onClick={openCreate} className="shrink-0 px-4 py-2.5 bg-green-700 text-white rounded-full text-sm font-medium hover:bg-green-800 transition flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nuevo hotel
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        {hotels.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">🏨</p>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {search ? 'No se encontraron hoteles' : tab === 'manage' ? 'Aún no has creado ningún hotel' : 'No hay hoteles disponibles'}
            </h3>
            {search
              ? <button onClick={handleClear} className="mt-4 text-green-700 text-sm underline">Ver todos</button>
              : tab === 'manage' && (
                <button onClick={openCreate} className="mt-4 px-5 py-2.5 bg-green-700 text-white rounded-full text-sm hover:bg-green-800 transition">
                  Crear primer hotel
                </button>
              )
            }
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map(hotel => {
              const coords = parseCoords(hotel.location);
              return (
                <div key={hotel.id} className="group bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Imagen */}
                  <div className="relative h-48 bg-gradient-to-br from-green-100 to-emerald-200 overflow-hidden">
                    {hotel.images?.[0]
                      ? <img src={hotel.images[0]} alt={hotel.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center"><span className="text-6xl">🏡</span></div>
                    }
                    <span className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full font-semibold ${hotel.isActive ? 'bg-white text-green-700' : 'bg-white text-gray-500'}`}>
                      {hotel.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                    {tab === 'explore' && (
                      <button
                        onClick={e => { e.stopPropagation(); toggleFav(hotel.id); }}
                        className="absolute top-3 left-3 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-sm hover:scale-110 transition-all"
                        aria-label={isFav(hotel.id) ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24"
                          fill={isFav(hotel.id) ? '#e11d48' : 'none'}
                          stroke={isFav(hotel.id) ? '#e11d48' : '#6b7280'}
                          strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                      </button>
                    )}
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
                    {hotel.description && <p className="text-xs text-gray-400 line-clamp-1 mb-2">{hotel.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                      {hotel.phone && <span>📞 {hotel.phone}</span>}
                      {hotel.images?.length > 0 && <span>🖼️ {hotel.images.length} img</span>}
                    </div>

                    {/* Previsión del tiempo */}
                    {tab === 'explore' && coords && (
                      <div className="border-t border-gray-100 pt-3 mb-3">
                        <button
                          onClick={() => toggleWeather(hotel.id)}
                          className="flex items-center gap-2 text-xs text-sky-600 hover:text-sky-700 font-medium transition w-full"
                        >
                          <span>🌤️</span>
                          <span>{weatherOpen.has(hotel.id) ? 'Ocultar previsión' : 'Ver previsión del tiempo (5 días)'}</span>
                          <svg className={`ml-auto w-3 h-3 transition-transform duration-200 ${weatherOpen.has(hotel.id) ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

                    {/* Botones manage ── ✅ añadido botón Ocupación */}
                    {tab === 'manage' && (
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <button onClick={() => openEdit(hotel)}
                          className="flex-1 py-2 text-xs font-medium border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 transition">
                          ✏️ Editar
                        </button>
                        <button onClick={() => openRooms(hotel)}
                          className="flex-1 py-2 text-xs font-medium border border-blue-200 rounded-full text-blue-700 hover:bg-blue-50 transition">
                          🛏️ Hab.
                        </button>
                        <button onClick={() => openCalendar(hotel)}
                          className="flex-1 py-2 text-xs font-medium border border-orange-200 rounded-full text-orange-600 hover:bg-orange-50 transition">
                          📅 Ocup.
                        </button>
                        <button onClick={() => handleDelete(hotel)}
                          className="flex-1 py-2 text-xs font-medium border border-red-100 rounded-full text-red-600 hover:bg-red-50 transition">
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Paginación */}
        {response && response.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
              ← Anterior
            </button>
            {Array.from({ length: response.totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-full text-sm font-medium transition ${p === page ? 'bg-green-700 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(response.totalPages, p + 1))} disabled={page === response.totalPages}
              className="px-4 py-2 border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
              Siguiente →
            </button>
          </div>
        )}

        {/* Modal crear / editar */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
                <h3 className="text-lg font-bold text-gray-900">{editing ? 'Editar hotel' : 'Nuevo hotel'}</h3>
                <button onClick={() => setModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-400">✕</button>
              </div>

              <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                {formError && <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">{formError}</p>}

                {[
                  { label: 'Nombre *',    key: 'name',    type: 'text', ph: 'Nombre del hotel' },
                  { label: 'Dirección *', key: 'address', type: 'text', ph: 'Ej: Sierra Norte, Madrid' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                    <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.ph} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Descripción del hotel" rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación <span className="text-gray-400 font-normal">(lat, lng) — necesaria para el tiempo</span>
                  </label>
                  <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="Ej: 40.4168, -3.7038"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[['Teléfono','phone','text','Teléfono'],['Email','email','email','Email del hotel']].map(([label,key,type,ph]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                      <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={ph} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Imágenes <span className="text-gray-400 font-normal">(URLs)</span></label>
                  {form.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {form.images.map((url, i) => (
                        <div key={i} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-gray-200">
                          <img src={url} alt={`img-${i}`} className="w-full h-full object-cover" />
                          <button onClick={() => removeImage(i)} className="absolute inset-0 bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition">🗑️</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input type="url" value={imageInput} onChange={e => setImageInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImage(); } }}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    <button type="button" onClick={addImage} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition">Añadir</button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Pulsa Enter o "Añadir" para agregar cada URL</p>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-green-700" />
                  <span className="text-sm text-gray-700">Hotel activo</span>
                </label>
              </div>

              <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-gray-100 shrink-0">
                <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-green-700 text-white rounded-full text-sm font-semibold hover:bg-green-800 disabled:opacity-50 transition">
                  {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear hotel'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal calendario ocupación ✅ ──────────────────────────────── */}
        {calModal.open && calModal.hotel && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Ocupación</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{calModal.hotel.name}</p>
                </div>
                <button
                  onClick={() => setCalModal({ open: false, rooms: [] })}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-400"
                >✕</button>
              </div>

              <div className="overflow-y-auto flex-1 p-6">
                {calLoading ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="animate-pulse h-64 bg-gray-100 rounded-2xl" />
                    ))}
                  </div>
                ) : calModal.rooms.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-5xl mb-3">🛏️</p>
                    <p className="text-gray-400 text-sm">Este hotel no tiene habitaciones registradas.</p>
                  </div>
                ) : (
                  <AdminOccupancyCalendar rooms={calModal.rooms} />
                )}
              </div>
            </div>
          </div>
        )}
        {/* ─────────────────────────────────────────────────────────────── */}
      </div>

      {roomsModal.open && roomsModal.hotel && (
        <HotelRooms hotelId={roomsModal.hotel.id} hotelName={roomsModal.hotel.name} token={token} onClose={() => setRoomsModal({ open: false })} />
      )}
    </>
  );
}