// src/pages/dashboard/RestaurantsMap.tsx
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix iconos — idéntico a HikingRoutes.tsx
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const hotelIcon = new L.Icon({
  iconUrl:   'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const PRICE_COLOR: Record<string, string> = {
  '€':   'bg-green-50 text-green-700 border-green-200',
  '€€':  'bg-yellow-50 text-yellow-700 border-yellow-200',
  '€€€': 'bg-red-50 text-red-600 border-red-200',
};

interface Restaurant {
  id: string; name: string;
  lat: number; lng: number;
  description?: string | null;
  cuisineType?: string | null;
  priceRange?: string | null;
  phone?: string | null;
  website?: string | null;
  rating?: number | null;
  distanceKm?: number;
}

interface Hotel { id: string; name: string; }

// Centra el mapa cuando cambia el hotel — igual que MapFitter en HikingRoutes
function MapCenterer({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 14); }, [lat, lng, map]);
  return null;
}

export default function RestaurantsMap() {
  const API   = import.meta.env.VITE_API_URL;

  const [hotels,       setHotels]       = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string>('');
  const [hotelCoords,  setHotelCoords]  = useState<{ lat: number; lng: number } | null>(null);
  const [restaurants,  setRestaurants]  = useState<Restaurant[]>([]);
  const [selected,     setSelected]     = useState<Restaurant | null>(null);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [loadingMap,   setLoadingMap]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const RADIUS_M = 10_000; // 10 km

  // Cargar hoteles — idéntico a HikingRoutes
  useEffect(() => {
    fetch(`${API}/hotels?limit=100`)
      .then(r => r.json())
      .then(d => {
        const list: any[] = d.data ?? d ?? [];
        setHotels(list);
        if (list.length > 0) setSelectedHotel(list[0].id);
      })
      .catch(() => setError('Error al cargar hoteles'))
      .finally(() => setLoadingHotels(false));
  }, []);

  // Cargar restaurantes cuando cambia el hotel
  useEffect(() => {
    if (!selectedHotel) return;
    setLoadingMap(true);
    setRestaurants([]);
    setSelected(null);
    setError(null);

    // 1. Obtener coordenadas del hotel para centrar mapa y calcular proximidad
    fetch(`${API}/hotels/${selectedHotel}`)
      .then(r => r.json())
      .then(async (hotel: any) => {
        const coords = { lat: Number(hotel.lat), lng: Number(hotel.lng) };
        setHotelCoords(coords);

        // 2. Cargar restaurantes cercanos
        const res = await fetch(
          `${API}/restaurants/hotel/${selectedHotel}/nearby?lat=${coords.lat}&lng=${coords.lng}&radius=${RADIUS_M}`
        );
        const data = await res.json();
        setRestaurants(Array.isArray(data) ? data : []);
      })
      .catch(() => setError('Error al cargar restaurantes'))
      .finally(() => setLoadingMap(false));
  }, [selectedHotel]);

  if (loadingHotels) return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl animate-pulse h-32" />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">

      {/* Cabecera — idéntica a HikingRoutes */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🍽️ Restaurantes cercanos</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {restaurants.length} restaurante{restaurants.length !== 1 ? 's' : ''} en {RADIUS_M / 1000} km
          </p>
        </div>

        {/* Selector hotel */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
          <select
            value={selectedHotel}
            onChange={e => setSelectedHotel(e.target.value)}
            className="pl-8 pr-8 py-2.5 border border-gray-200 rounded-full text-sm text-gray-700
              focus:outline-none focus:ring-2 focus:ring-green-500 bg-white appearance-none cursor-pointer md:w-56"
          >
            {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-xl">{error}</p>}

      {/* Layout lista + mapa — idéntico a HikingRoutes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Lista */}
        <div className="space-y-3">
          {loadingMap ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl h-28 border border-gray-100" />
            ))
          ) : restaurants.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl">
              <p className="text-5xl mb-3">🍽️</p>
              <p className="text-gray-500 font-medium">Sin restaurantes cercanos</p>
              <p className="text-gray-400 text-sm mt-1">Prueba con otro hotel</p>
            </div>
          ) : (
            restaurants.map(r => {
              const isSelected = selected?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelected(isSelected ? null : r)}
                  className={`bg-white rounded-2xl p-4 cursor-pointer transition-all border ${
                    isSelected
                      ? 'ring-2 ring-green-500 shadow-md border-transparent'
                      : 'border-gray-100 hover:shadow-md'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-orange-100 to-amber-200 flex items-center justify-center">
                      <span className="text-3xl">🍽️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">{r.name}</h3>
                        {r.priceRange && (
                          <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${PRICE_COLOR[r.priceRange] ?? ''}`}>
                            {r.priceRange}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                        {r.cuisineType   && <span>{r.cuisineType}</span>}
                        {r.rating        && <span>⭐ {r.rating}</span>}
                        {r.distanceKm !== undefined && <span>📍 {r.distanceKm} km</span>}
                      </div>
                      {r.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{r.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Detalle expandido al seleccionar */}
                  {isSelected && (r.phone || r.website) && (
                    <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
                      {r.phone && (
                        <a href={`tel:${r.phone}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100
                            text-green-700 rounded-full text-xs font-medium transition-colors"
                          onClick={e => e.stopPropagation()}>
                          📞 {r.phone}
                        </a>
                      )}
                      {r.website && (
                        <a href={r.website} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100
                            text-blue-700 rounded-full text-xs font-medium transition-colors"
                          onClick={e => e.stopPropagation()}>
                          🌐 Web
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Mapa — sticky igual que HikingRoutes */}
        <div className="sticky top-24 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          {hotelCoords && (
            <MapContainer
              center={[hotelCoords.lat, hotelCoords.lng]}
              zoom={13}
              style={{ height: 460, width: '100%' }}
              key={selectedHotel}
            >
              <MapCenterer lat={hotelCoords.lat} lng={hotelCoords.lng} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {/* Radio de búsqueda */}
              <Circle
                center={[hotelCoords.lat, hotelCoords.lng]}
                radius={RADIUS_M}
                pathOptions={{ color: '#15803d', fillColor: '#15803d', fillOpacity: 0.05, weight: 1.5 }}
              />

              {/* Marcador hotel */}
              <Marker position={[hotelCoords.lat, hotelCoords.lng]} icon={hotelIcon}>
                <Popup>
                  <strong>{hotels.find(h => h.id === selectedHotel)?.name}</strong>
                </Popup>
              </Marker>

              {/* Marcadores restaurantes */}
              {restaurants.map(r => (
                <Marker key={r.id} position={[Number(r.lat), Number(r.lng)]}>
                  <Popup>
                    <div className="min-w-[160px]">
                      <p className="font-semibold text-gray-900">{r.name}</p>
                      {r.cuisineType  && <p className="text-xs text-gray-500">{r.cuisineType}</p>}
                      {r.priceRange   && <p className="text-xs font-semibold text-green-700 mt-1">{r.priceRange}</p>}
                      {r.rating       && <p className="text-xs text-gray-500 mt-1">⭐ {r.rating}</p>}
                      {r.distanceKm !== undefined && (
                        <p className="text-xs text-blue-500 mt-1">📍 {r.distanceKm} km del hotel</p>
                      )}
                      {r.phone && <p className="text-xs text-gray-400 mt-1">📞 {r.phone}</p>}
                      {r.website && (
                        <a href={r.website} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-green-700 underline mt-1 block">
                          Ver web
                        </a>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}

          {!hotelCoords && !loadingMap && (
            <div className="h-[460px] bg-gray-50 flex flex-col items-center justify-center text-center p-8">
              <p className="text-5xl mb-4">🗺️</p>
              <p className="font-medium text-gray-700 mb-1">Selecciona un hotel</p>
              <p className="text-gray-400 text-sm">Se mostrará el mapa con los restaurantes cercanos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}