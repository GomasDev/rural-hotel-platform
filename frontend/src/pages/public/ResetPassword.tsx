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
    if (message) setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
          newPassword: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || 'Enlace expirado o inválido');
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

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-[#f5f7f2] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-xl border border-green-100 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-green-100">
            <svg className="h-10 w-10 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h2 className="mb-3 text-3xl font-bold text-gray-900">Enlace inválido</h2>
          <p className="mb-8 text-sm leading-6 text-gray-600">
            El enlace de recuperación no es válido o ha expirado.
          </p>

          <Link
            to="/forgot-password"
            className="block w-full rounded-xl bg-green-700 px-4 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-green-800"
          >
            Solicitar nuevo enlace
          </Link>

          <Link
            to="/login"
            className="mt-4 block text-sm font-medium text-green-700 transition hover:text-green-800 hover:underline"
          >
            ← Volver al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f2] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-green-100">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-green-700 shadow-md">
            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.308a1 1 0 01.326-.754l1.435-1.435A6.002 6.002 0 0016 7z" />
            </svg>
          </div>

          <h2 className="mb-2 text-3xl font-bold text-gray-900">Nueva contraseña</h2>
          <p className="text-sm text-gray-600">
            Introduce tu nueva contraseña para recuperar el acceso.
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              message.includes('¡Contraseña')
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Nueva contraseña *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              disabled={loading}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-sm text-gray-900 shadow-sm transition focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700/20 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Confirmar contraseña *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
              disabled={loading}
              placeholder="Repite la contraseña"
              className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-sm text-gray-900 shadow-sm transition focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700/20 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-green-700 py-4 text-sm font-semibold text-white shadow-md transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" className="opacity-90" />
                </svg>
                Actualizando...
              </span>
            ) : (
              'Restablecer contraseña'
            )}
          </button>
        </form>

        <div className="mt-8 space-y-2 border-t border-gray-100 pt-6 text-center text-sm">
          <Link
            to="/login"
            className="block font-medium text-green-700 transition hover:text-green-800 hover:underline"
          >
            ← Volver al login
          </Link>

          <Link
            to="/forgot-password"
            className="block text-gray-500 transition hover:text-gray-700 hover:underline"
          >
            Solicitar un nuevo enlace
          </Link>
        </div>
      </div>
    </div>
  );
}