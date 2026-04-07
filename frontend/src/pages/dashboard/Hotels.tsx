import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

type GeoLocation = string | { type: string; coordinates: [number, number] };

interface Hotel {
  id: string;
  name: string;
  description?: string;
  address: string;
  location?: GeoLocation;
  phone?: string;
  email?: string;
  images: string[];
  isActive: boolean;
  ownerId: string;
}

interface HotelsResponse {
  data: Hotel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const EMPTY_FORM = {
  name: '',
  description: '',
  address: '',
  location: '',
  phone: '',
  email: '',
  images: [] as string[],
  isActive: true,
};

type Tab = 'explore' | 'manage';

const formatLocation = (loc?: GeoLocation): string => {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  return `${loc.coordinates[1]}, ${loc.coordinates[0]}`;
};

export default function Hotels() {
  const { user } = useAuth();
  const isClient = user?.role === 'client';
  const isAdmin  = user?.role === 'admin';

  const [tab, setTab]                 = useState<Tab>('explore');
  const [response, setResponse]       = useState<HotelsResponse | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage]               = useState(1);
  const [sortBy, setSortBy]           = useState('createdAt_desc');
  const [refreshKey, setRefreshKey]   = useState(0); // ← fuerza refetch tras guardar/eliminar
  const LIMIT = 9;

  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<Hotel | null>(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');
  const [imageInput, setImageInput] = useState('');

  const token = localStorage.getItem('access_token');

  // ── Fetch principal (sin stale closures) ──────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);
    const [field, ord] = sortBy.split('_');
    const params = new URLSearchParams({
      page:   String(page),
      limit:  String(LIMIT),
      search,
      sortBy: field,
      order:  ord.toUpperCase(),
    });
    fetch(`${import.meta.env.VITE_API_URL}/hotels?${params}`)
      .then(res => { if (!res.ok) throw new Error('Error al cargar hoteles'); return res.json(); })
      .then(data => setResponse(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, search, sortBy, refreshKey]);

  // ── Reset al cambiar de tab ────────────────────────────────────────────────
  useEffect(() => { setPage(1); setSearch(''); setSearchInput(''); }, [tab]);

  // ── Fuerza refetch tras guardar o eliminar ────────────────────────────────
  const triggerRefresh = () => setRefreshKey(k => k + 1);

  // ── Filtrado por rol ───────────────────────────────────────────────────────
  const hotels = (response?.data ?? []).filter(h => {
    if (tab === 'explore') return true;
    if (isAdmin)           return h.ownerId === user?.id;
    return true;
  });

  // ── Buscador ───────────────────────────────────────────────────────────────
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); setSearch(searchInput); };
  const handleClear  = () => { setSearchInput(''); setSearch(''); setPage(1); };

  // ── Orden ──────────────────────────────────────────────────────────────────
  const handleSortChange = (value: string) => { setSortBy(value); setPage(1); };

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImageInput('');
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (hotel: Hotel) => {
    setEditing(hotel);
    setForm({
      name:        hotel.name,
      description: hotel.description ?? '',
      address:     hotel.address,
      location:    formatLocation(hotel.location),
      phone:       hotel.phone ?? '',
      email:       hotel.email ?? '',
      images:      hotel.images ?? [],
      isActive:    hotel.isActive,
    });
    setImageInput('');
    setFormError('');
    setModalOpen(true);
  };

  // ── Imágenes ───────────────────────────────────────────────────────────────
  const addImage = () => {
    const url = imageInput.trim();
    if (!url) return;
    if (!/^https?:\/\/.+/.test(url)) { setFormError('La URL debe comenzar por http:// o https://'); return; }
    setForm(f => ({ ...f, images: [...f.images, url] }));
    setImageInput('');
    setFormError('');
  };

  const removeImage = (index: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  // ── Guardar ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name || !form.address) { setFormError('Nombre y dirección son obligatorios'); return; }
    setSaving(true);
    setFormError('');
    const url    = editing ? `${import.meta.env.VITE_API_URL}/hotels/${editing.id}` : `${import.meta.env.VITE_API_URL}/hotels`;
    const method = editing ? 'PATCH' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message ?? 'Error al guardar'); }
      setModalOpen(false);
      triggerRefresh(); // ← antes fetchHotels()
    } catch (e: any) { setFormError(e.message); }
    finally { setSaving(false); }
  };

  // ── Eliminar ───────────────────────────────────────────────────────────────
  const handleDelete = async (hotel: Hotel) => {
    if (!confirm(`¿Eliminar "${hotel.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/hotels/${hotel.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al eliminar');
      triggerRefresh(); // ← antes fetchHotels()
    } catch (e: any) { alert(e.message); }
  };

  // ── Skeleton ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div>
      <div className="mb-6 h-10 bg-gray-200 rounded-xl animate-pulse w-full max-w-md" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
            <div className="h-40 bg-gray-200 rounded-xl mb-4" />
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="text-center py-16">
      <p className="text-4xl mb-4">⚠️</p>
      <p className="text-red-600 font-medium">{error}</p>
    </div>
  );

  return (
    <div>
      {/* ── Tabs ── */}
      {!isClient && (
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
          <button onClick={() => setTab('explore')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${tab === 'explore' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            🌍 Explorar
          </button>
          <button onClick={() => setTab('manage')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${tab === 'manage' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {isAdmin ? '🏨 Mis hoteles' : '⚙️ Gestión'}
          </button>
        </div>
      )}

      {/* ── Cabecera ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {tab === 'explore' ? 'Todos los hoteles' : isAdmin ? 'Mis hoteles' : 'Gestión de hoteles'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {hotels.length} hotel{hotels.length !== 1 ? 'es' : ''}
            {tab === 'manage' && isAdmin && <span className="ml-1 text-green-600">creados por ti</span>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Buscador */}
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-0">
            <div className="relative flex-1 md:w-52">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                placeholder="Buscar hotel..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <button type="submit" className="px-4 py-2 bg-green-700 text-white rounded-xl text-sm font-medium hover:bg-green-800 transition">Buscar</button>
            {search && (
              <button type="button" onClick={handleClear} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">Limpiar</button>
            )}
          </form>

          {/* Selector de orden */}
          <select
            value={sortBy}
            onChange={e => handleSortChange(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="createdAt_desc">⬇ Más recientes</option>
            <option value="createdAt_asc">⬆ Más antiguos</option>
            <option value="name_asc">A → Z</option>
            <option value="name_desc">Z → A</option>
          </select>

          {/* Botón crear */}
          {tab === 'manage' && (
            <button onClick={openCreate} className="shrink-0 px-4 py-2 bg-green-700 text-white rounded-xl text-sm font-medium hover:bg-green-800 transition flex items-center gap-2">
              <span>＋</span> Nuevo hotel
            </button>
          )}
        </div>
      </div>

      {/* ── Grid ── */}
      {hotels.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🏨</p>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {search ? 'No se encontraron hoteles' : tab === 'manage' ? 'Aún no has creado ningún hotel' : 'No hay hoteles disponibles'}
          </h3>
          {search
            ? <button onClick={handleClear} className="mt-4 text-green-700 text-sm underline">Ver todos</button>
            : tab === 'manage' && (
              <button onClick={openCreate} className="mt-4 px-5 py-2 bg-green-700 text-white rounded-xl text-sm hover:bg-green-800 transition">
                Crear primer hotel
              </button>
            )
          }
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map(hotel => (
            <div key={hotel.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
              <div className="h-40 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                {hotel.images?.[0]
                  ? <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover" loading="lazy" />
                  : <span className="text-5xl">🏡</span>
                }
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 text-lg leading-tight">{hotel.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ml-2 ${hotel.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {hotel.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                {hotel.description && <p className="text-gray-500 text-sm mb-3 line-clamp-2">{hotel.description}</p>}
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p className="flex items-center gap-2"><span>📍</span>{hotel.address}</p>
                  {hotel.location && (
                    <p className="flex items-center gap-2"><span>🗺️</span>{formatLocation(hotel.location)}</p>
                  )}
                  {hotel.phone && <p className="flex items-center gap-2"><span>📞</span>{hotel.phone}</p>}
                  {hotel.email && <p className="flex items-center gap-2"><span>✉️</span>{hotel.email}</p>}
                  {hotel.images?.length > 0 && (
                    <p className="flex items-center gap-2"><span>🖼️</span>{hotel.images.length} imagen{hotel.images.length !== 1 ? 'es' : ''}</p>
                  )}
                </div>
                {tab === 'manage' && (
                  <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100">
                    <button onClick={() => openEdit(hotel)} className="flex-1 py-2 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition">
                      ✏️ Editar
                    </button>
                    <button onClick={() => handleDelete(hotel)} className="flex-1 py-2 text-sm border border-red-100 rounded-xl text-red-600 hover:bg-red-50 transition">
                      🗑️ Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Paginación ── */}
      {response && response.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
            ← Anterior
          </button>
          {Array.from({ length: response.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-sm font-medium transition ${p === page ? 'bg-green-700 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(response.totalPages, p + 1))} disabled={page === response.totalPages}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
            Siguiente →
          </button>
        </div>
      )}

      {/* ── Modal crear / editar ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-bold text-gray-800">{editing ? 'Editar hotel' : 'Nuevo hotel'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              {formError && <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{formError}</p>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nombre del hotel"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descripción del hotel" rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Ej: Sierra Norte, Madrid"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación <span className="text-gray-400 font-normal">(lat, lng)</span>
                </label>
                <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="Ej: 40.4168, -3.7038"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="Teléfono"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="Email del hotel"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imágenes <span className="text-gray-400 font-normal">(URLs)</span>
                </label>
                {form.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.images.map((url, i) => (
                      <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                        <img src={url} alt={`img-${i}`} className="w-full h-full object-cover" />
                        <button onClick={() => removeImage(i)}
                          className="absolute inset-0 bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input type="url" value={imageInput} onChange={e => setImageInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImage(); } }}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  <button type="button" onClick={addImage}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition">
                    Añadir
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Pulsa Enter o "Añadir" para agregar cada URL</p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-green-700" />
                <span className="text-sm text-gray-700">Hotel activo</span>
              </label>
            </div>

            <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-gray-100 shrink-0">
              <button onClick={() => setModalOpen(false)}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2 bg-green-700 text-white rounded-xl text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition">
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear hotel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}