import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

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

      {/* PLACEHOLDERS CU-NR-01 / 02 / 03 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8 py-16 max-w-6xl mx-auto">

        {/* CU-NR-01: Ver hoteles */}
        <div className="bg-white rounded-2xl shadow p-6 text-center border border-gray-100">
          <div className="text-5xl mb-4">🏨</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Hoteles rurales</h3>
          <p className="text-gray-400 text-sm">Explora nuestra selección de alojamientos con encanto.</p>
          <span className="inline-block mt-4 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
            Próximamente
          </span>
        </div>

        {/* CU-NR-02: Ver actividades */}
        <div className="bg-white rounded-2xl shadow p-6 text-center border border-gray-100">
          <div className="text-5xl mb-4">🥾</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Actividades</h3>
          <p className="text-gray-400 text-sm">Rutas de senderismo, trekking y aventura en la naturaleza.</p>
          <span className="inline-block mt-4 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
            Próximamente
          </span>
        </div>

        {/* CU-NR-03: Ver reservas */}
        <div className="bg-white rounded-2xl shadow p-6 text-center border border-gray-100">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Reservas</h3>
          <p className="text-gray-400 text-sm">Gestiona tus reservas de forma sencilla y rápida.</p>
          <span className="inline-block mt-4 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
            Próximamente
          </span>
        </div>

      </section>
    </div>
  );
}
