import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Email no encontrado');
        return;
      }

      setSent(true);
      setMessage('¡Email enviado! Revisa tu bandeja de entrada.');
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
        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Recuperar contraseña</h2>
        <p className="text-gray-400 mb-4 text-sm text-center">
          Te enviaremos un enlace para restablecerla
        </p>

        <button 
          onClick={() => navigate('/login')} 
          className="text-green-700 hover:underline bg-transparent border-none p-0 text-sm mx-auto block mb-6"
        >
          Volver al login
        </button>

        {/* Mensajes de Error o Éxito */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-4 text-center">
            {message}
          </div>
        )}

        {/* Formulario / Estado Enviado */}
        {!sent ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Tu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="bg-green-700 text-white py-3 rounded-lg hover:bg-green-800 transition font-medium disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 mb-6 text-sm">
              Si el email está registrado, recibirás un mensaje en unos minutos.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-green-700 text-white py-3 rounded-lg hover:bg-green-800 transition font-medium"
            >
              Entendido
            </button>
          </div>
        )}

        <p className="text-gray-400 text-sm mt-8 text-center">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-green-700 hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}