import { useEffect, useState } from 'react';

interface Hotel {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone?: string;
  email?: string;
  images: string[];
  isActive: boolean;
}

interface HotelsResponse {
  data: Hotel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function Hotels() {
  const [response, setResponse] = useState<HotelsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 9;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(LIMIT),
      search,
    });

    fetch(`${import.meta.env.VITE_API_URL}/hotels?${params}`)
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar hoteles');
        return res.json();
      })
      .then(data => setResponse(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleClear = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div>
      <div className="mb-6 h-10 bg-gray-200 rounded-xl animate-pulse w-full max-w-md" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(LIMIT)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
            <div className="h-40 bg-gray-200 rounded-xl mb-4" />
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-full mb-1" />
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
      {/* ── Cabecera ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Hoteles</h2>
          <p className="text-gray-500 text-sm mt-1">
            {response?.total ?? 0} hotel{response?.total !== 1 ? 'es' : ''} encontrado{response?.total !== 1 ? 's' : ''}
          </p>
        </div>

        {/* ── Buscador ── */}
        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre o ciudad..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-green-700 text-white rounded-xl text-sm font-medium hover:bg-green-800 transition"
          >
            Buscar
          </button>
          {search && (
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              Limpiar
            </button>
          )}
        </form>
      </div>

      {/* ── Grid ── */}
      {response?.data.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🏨</p>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No se encontraron hoteles</h3>
          <p className="text-gray-500 text-sm">Prueba con otro término de búsqueda.</p>
          {search && (
            <button onClick={handleClear} className="mt-4 text-green-700 text-sm underline">
              Ver todos los hoteles
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {response?.data.map(hotel => (
            <div key={hotel.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                {hotel.images?.[0]
                  ? <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover" loading="lazy" />
                  : <span className="text-5xl">🏡</span>
                }
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 text-lg leading-tight">{hotel.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ml-2 ${
                    hotel.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {hotel.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                {hotel.description && (
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">{hotel.description}</p>
                )}
                <div className="space-y-1 text-sm text-gray-600">
                  <p className="flex items-center gap-2"><span>📍</span>{hotel.address}</p>
                  {hotel.phone && <p className="flex items-center gap-2"><span>📞</span>{hotel.phone}</p>}
                  {hotel.email && <p className="flex items-center gap-2"><span>✉️</span>{hotel.email}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Paginación ── */}
      {response && response.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ← Anterior
          </button>

          {Array.from({ length: response.totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-sm font-medium transition ${
                p === page
                  ? 'bg-green-700 text-white'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage(p => Math.min(response.totalPages, p + 1))}
            disabled={page === response.totalPages}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}