import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';

interface FormData {
  password: string;
  confirmPassword: string;
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams<{ token?: string }>();
  const [formData, setFormData] = useState<FormData>({
    password: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [token, setToken] = useState('');

  // Extraer token de URL (?token=abc123) o ruta (/reset-password/:token)
  useEffect(() => {
    const urlToken = searchParams.get('token') ?? params.token;

    if (urlToken) {
      setToken(urlToken);
      setIsValidToken(true);
      setMessage('');
    } else {
      setToken('');
      setMessage('Enlace inválido. Solicita uno nuevo.');
      setIsValidToken(false);
    }
  }, [searchParams, params.token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Limpiar mensaje si tipando
    if (message) setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar contraseñas coinciden
    if (formData.password !== formData.confirmPassword) {
      setMessage('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      setMessage('Mínimo 8 caracteres');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          newPassword: formData.password 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || 'Enlace expirado/inválido');
        return;
      }

      setMessage('¡Contraseña restablecida! Puedes iniciar sesión.');
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch {
      setMessage('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Token inválido
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-3xl shadow-2xl p-12 w-full max-w-md text-center border border-red-200">
          <div className="w-24 h-24 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Enlace inválido</h2>
          <p className="text-gray-600 mb-8">El token ha expirado o no es válido.</p>
          <Link 
            to="/forgot-password"
            className="w-full block bg-gradient-to-r from-orange-600 to-red-600 text-white py-4 rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 font-semibold shadow-lg"
          >
            Solicitar nuevo enlace
          </Link>
          <p className="mt-6 text-sm text-gray-500">
            <Link to="/login" className="text-blue-600 hover:underline">← Volver al login</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/50">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.308a1 1 0 01.326-.754l1.435-1.435A6.002 6.002 0 0016 7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-emerald-700 bg-clip-text text-transparent mb-2">
            Nueva contraseña
          </h2>
          <p className="text-gray-600">Ingresa tu nueva contraseña segura</p>
        </div>

        {/* Mensaje */}
        {message && (
          <div className={`p-4 rounded-xl text-sm mb-6 ${
            message.includes('¡Contraseña') 
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nueva contraseña *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              disabled={loading}
              placeholder="Mínimo 8 caracteres"
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar contraseña *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
              disabled={loading}
              placeholder="Repite la contraseña"
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 text-white py-4 rounded-xl hover:from-emerald-700 hover:to-blue-700 transition-all duration-200 font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path fill="currentColor" d="M12 2.5a2.5 2.5 0 0 1 2.5 2.5v1a2.5 2.5 0 0 1-5 0v-1a2.5 2.5 0 0 1 2.5-2.5z" />
                </svg>
                Actualizando...
              </span>
            ) : (
              'Restablecer contraseña'
            )}
          </button>
        </form>

        {/* Navegación */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-500 space-y-2">
          <Link to="/login" className="block text-emerald-600 hover:text-emerald-700 hover:underline transition-colors py-2 font-medium">
            ← Volver al login
          </Link>
          <Link to="/forgot-password" className="block text-gray-500 hover:text-gray-700 hover:underline transition-colors py-2">
            Nuevo enlace de recuperación
          </Link>
        </div>
      </div>
    </div>
  );
}
