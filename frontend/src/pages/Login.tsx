import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Email o contraseña incorrectos');
        return;
      }

      // ✅ Guarda el token en localStorage
      localStorage.setItem('access_token', data.access_token);

      navigate('/dashboard'); // → Sprint 2
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">

      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-md">

        {/* Header */}
        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Iniciar sesión</h2>
        <p className="text-gray-400 mb-4 text-sm text-center">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-green-700 hover:underline">
              Regístrate
            </Link>
          </p>

        <button onClick={() => navigate('/')} className="text-green-700 hover:underline bg-transparent border-none p-0 text-sm mx-auto block mb-4">
          Inicio
        </button>
        

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleChange}
            required
            className="border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-green-700 text-white py-3 rounded-lg hover:bg-green-800 transition font-medium disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-gray-400 text-sm mt-4 text-center">
          <Link to="/forgot-password" className="text-green-700 hover:underline text-center">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>

      </div>
    </div>
  );
}
