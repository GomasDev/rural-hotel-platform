import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix iconos Leaflet con Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Hotel { id: string; name: string; address: string; }

interface HikingRoute {
  id: string; name: string; description?: string;
  difficulty: 'low' | 'medium' | 'high';
  distanceKm: number; durationMinutes?: number; elevationGainM?: number;
  images?: string[]; gpxFileUrl?: string; isActive: boolean;
}

interface GeoJsonLineString {
  type: 'LineString';
  coordinates: [number, number][];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const DIFF_LABEL = { low: 'Fácil', medium: 'Media', high: 'Difícil' };
const DIFF_COLOR = {
  low:    'bg-green-50 text-green-700 border-green-200',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  high:   'bg-red-50 text-red-600 border-red-200',
};
const POLYLINE_COLOR = { low: '#16a34a', medium: '#ca8a04', high: '#dc2626' };

function formatDuration(min?: number) {
  if (!min) return null;
  const h = Math.floor(min / 60), m = min % 60;
  return h > 0 ? `${h}h ${m > 0 ? `${m}min` : ''}`.trim() : `${m}min`;
}

// Ajusta el mapa a los bounds de la polilínea seleccionada
function MapFitter({ positions }: { positions: [number, number][] | null }) {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 0) {
      map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] });
    }
  }, [positions, map]);
  return null;
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function HikingRoutes() {
  const [hotels, setHotels]               = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string>('all');
  const [routes, setRoutes]               = useState<HikingRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<HikingRoute | null>(null);
  const [routePositions, setRoutePositions] = useState<[number, number][] | null>(null);
  const [diffFilter, setDiffFilter]       = useState<string>('all');
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [loadingMap, setLoadingMap]       = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const API = import.meta.env.VITE_API_URL;

  // Cargar hoteles
  useEffect(() => {
    fetch(`${API}/hotels?limit=100`)
      .then(r => r.json())
      .then(d => setHotels(d.data ?? d))
      .catch(() => setError('Error al cargar hoteles'))
      .finally(() => setLoadingHotels(false));
  }, []);

  // Cargar rutas
  useEffect(() => {
    setLoadingRoutes(true);
    setRoutes([]);
    setSelectedRoute(null);
    setRoutePositions(null);
    setError(null);

    if (selectedHotel === 'all') {
      fetch(`${API}/hiking-routes`)
        .then(r => r.json())
        .then(d => setRoutes(Array.isArray(d) ? d : []))
        .catch(() => setError('Error al cargar rutas'))
        .finally(() => setLoadingRoutes(false));
    } else {
      fetch(`${API}/hotels/${selectedHotel}/hiking-routes`)
        .then(r => r.json())
        .then(d => setRoutes(Array.isArray(d) ? d : []))
        .catch(() => setError('Error al cargar rutas'))
        .finally(() => setLoadingRoutes(false));
    }
  }, [selectedHotel]);

  // Cargar GeoJSON de la ruta seleccionada
  async function selectRoute(route: HikingRoute) {
    if (selectedRoute?.id === route.id) {
      setSelectedRoute(null);
      setRoutePositions(null);
      return;
    }
    setSelectedRoute(route);
    setRoutePositions(null);
    setLoadingMap(true);

    // Buscar hotelId de la ruta
    const hotelId = (route as any).hotel?.id ?? selectedHotel;
    if (!hotelId || hotelId === 'all') {
      setLoadingMap(false);
      return;
    }

    try {
      const res = await fetch(`${API}/hotels/${hotelId}/hiking-routes/${route.id}/geojson`);
      const data: { route: HikingRoute; geojson: GeoJsonLineString } = await res.json();
      if (data.geojson?.coordinates) {
        // GeoJSON usa [lng, lat] → Leaflet necesita [lat, lng]
        const positions: [number, number][] = data.geojson.coordinates.map(
          ([lng, lat]) => [lat, lng]
        );
        setRoutePositions(positions);
      }
    } catch {}
    finally { setLoadingMap(false); }
  }

  function downloadGpx(route: HikingRoute) {
    const hotelId = (route as any).hotel?.id ?? selectedHotel;
    if (!hotelId || hotelId === 'all') return;
    const url = `${API}/hotels/${hotelId}/hiking-routes/${route.id}/download-gpx`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${route.name}.gpx`;
    a.click();
  }

  const filtered = routes.filter(r => diffFilter === 'all' || r.difficulty === diffFilter);

  if (loadingHotels) return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl animate-pulse h-32" />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">

      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rutas de senderismo</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {filtered.length} ruta{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Selector hotel */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
            <select value={selectedHotel} onChange={e => setSelectedHotel(e.target.value)}
              className="pl-8 pr-8 py-2.5 border border-gray-200 rounded-full text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white appearance-none cursor-pointer md:w-56">
              <option value="all">Todos los hoteles</option>
              {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>

          {/* Filtro dificultad */}
          <div className="flex gap-1.5">
            {[
              { key: 'all', label: 'Todas' },
              { key: 'low', label: '🟢 Fácil' },
              { key: 'medium', label: '🟡 Media' },
              { key: 'high', label: '🔴 Difícil' },
            ].map(f => (
              <button key={f.key} onClick={() => setDiffFilter(f.key)}
                className={`px-3 py-2 rounded-full text-xs font-medium border transition-colors ${
                  diffFilter === f.key
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-xl">{error}</p>}

      {/* Layout: lista + mapa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Lista rutas */}
        <div className="space-y-3">
          {loadingRoutes ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl h-28" />
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl">
              <p className="text-5xl mb-3">🥾</p>
              <p className="text-gray-500 font-medium">Sin rutas disponibles</p>
              <p className="text-gray-400 text-sm mt-1">Prueba con otro hotel o dificultad</p>
            </div>
          ) : (
            filtered.map(route => {
              const isSelected = selectedRoute?.id === route.id;
              return (
                <div
                  key={route.id}
                  onClick={() => selectRoute(route)}
                  className={`bg-white rounded-2xl p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'ring-2 ring-green-500 shadow-md'
                      : 'hover:shadow-md border border-gray-100'
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Imagen */}
                    <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-green-100 to-emerald-200">
                      {route.images?.[0] ? (
                        <img src={route.images[0]} alt={route.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">🏔️</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">{route.name}</h3>
                        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${DIFF_COLOR[route.difficulty]}`}>
                          {DIFF_LABEL[route.difficulty]}
                        </span>
                      </div>

                      {route.description && (
                        <p className="text-xs text-gray-400 line-clamp-1 mb-2">{route.description}</p>
                      )}

                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span>📏 {route.distanceKm} km</span>
                        {route.durationMinutes && <span>⏱ {formatDuration(route.durationMinutes)}</span>}
                        {route.elevationGainM && <span>⬆️ {route.elevationGainM} m</span>}
                      </div>
                    </div>
                  </div>

                  {/* Botones (solo visible en ruta seleccionada) */}
                  {isSelected && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={e => { e.stopPropagation(); downloadGpx(route); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-full text-xs font-medium transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Descargar GPX
                      </button>
                      {loadingMap && (
                        <span className="flex items-center gap-1.5 text-xs text-gray-400">
                          <span className="w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                          Cargando mapa…
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Mapa Leaflet */}
        <div className="sticky top-24 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          {selectedRoute ? (
            <>
              <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{selectedRoute.name}</p>
                  <p className="text-xs text-gray-400">{selectedRoute.distanceKm} km · {DIFF_LABEL[selectedRoute.difficulty]}</p>
                </div>
                <button
                  onClick={() => { setSelectedRoute(null); setRoutePositions(null); }}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <MapContainer
                center={routePositions?.[0] ?? [40.416, -3.703]}
                zoom={13}
                style={{ height: '420px', width: '100%' }}
                key={selectedRoute.id}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {routePositions && routePositions.length > 0 && (
                  <>
                    <MapFitter positions={routePositions} />
                    <Polyline
                      positions={routePositions}
                      color={POLYLINE_COLOR[selectedRoute.difficulty]}
                      weight={4}
                      opacity={0.85}
                    />
                    {/* Marcador inicio */}
                    <Marker position={routePositions[0]}>
                      <Popup>
                        <strong>{selectedRoute.name}</strong><br />
                        Inicio de la ruta
                      </Popup>
                    </Marker>
                    {/* Marcador fin */}
                    <Marker position={routePositions[routePositions.length - 1]}>
                      <Popup>Meta — {selectedRoute.distanceKm} km</Popup>
                    </Marker>
                  </>
                )}
                {!routePositions && !loadingMap && (
                  <div className="absolute inset-0 flex items-center justify-center z-[1000] bg-white/70">
                    <p className="text-sm text-gray-400">Sin datos de geometría para esta ruta</p>
                  </div>
                )}
              </MapContainer>
            </>
          ) : (
            <div className="h-[460px] bg-gray-50 flex flex-col items-center justify-center text-center p-8">
              <p className="text-5xl mb-4">🗺️</p>
              <p className="font-medium text-gray-700 mb-1">Selecciona una ruta</p>
              <p className="text-gray-400 text-sm">Se mostrará el trazado aquí</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}