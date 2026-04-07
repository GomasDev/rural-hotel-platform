import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';

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

export default function LandingPage() {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<Hotel[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/hotels`)
      .then(res => res.json())
      .then(data => setHotels(data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* HERO */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-24 bg-gradient-to-b from-green-50 to-white">
        <h2 className="text-5xl font-bold text-gray-800 mb-4">
          Descubre el turismo rural
        </h2>
        <p className="text-xl text-gray-500 mb-8 max-w-xl">
          Encuentra hoteles rurales únicos, actividades de senderismo y experiencias auténticas en plena naturaleza.
        </p>
        <button
          onClick={() => navigate('/register')}
          className="px-8 py-4 bg-green-700 text-white text-lg rounded-xl hover:bg-green-800 transition"
        >
          Empieza ahora →
        </button>
      </section>

      {/* HOTELES REALES */}
      {hotels.length > 0 && (
        <section className="px-8 py-16 max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-gray-800 mb-8 text-center">Hoteles disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {hotels.map(hotel => (
              <div key={hotel.id} className="bg-white rounded-2xl shadow p-6 border border-gray-100 hover:shadow-md transition">
                <div className="h-36 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mb-4">
                  {hotel.images?.[0]
                    ? <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover rounded-xl" />
                    : <span className="text-5xl">🏡</span>
                  }
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-1">{hotel.name}</h4>
                {hotel.description && (
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{hotel.description}</p>
                )}
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <span>📍</span> {hotel.address}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PLACEHOLDERS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8 py-16 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-6 text-center border border-gray-100">
          <div className="text-5xl mb-4">🏨</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Hoteles rurales</h3>
          <p className="text-gray-400 text-sm">Explora nuestra selección de alojamientos con encanto.</p>
          <span className="inline-block mt-4 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">Próximamente</span>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 text-center border border-gray-100">
          <div className="text-5xl mb-4">🥾</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Actividades</h3>
          <p className="text-gray-400 text-sm">Rutas de senderismo, trekking y aventura en la naturaleza.</p>
          <span className="inline-block mt-4 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">Próximamente</span>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 text-center border border-gray-100">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Reservas</h3>
          <p className="text-gray-400 text-sm">Gestiona tus reservas de forma sencilla y rápida.</p>
          <span className="inline-block mt-4 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">Próximamente</span>
        </div>
      </section>
    </div>
  );
}