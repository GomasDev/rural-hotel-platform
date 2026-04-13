import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface User {
  id: string;
  name: string;
  lastName1: string;
  lastName2?: string;
  email: string;
  role: 'superadmin' | 'admin' | 'client';
}

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Superadmin',
  admin:      'Admin',
  client:     'Cliente',
};

const ROLE_COLOR: Record<string, string> = {
  superadmin: 'bg-purple-100 text-purple-700',
  admin:      'bg-blue-100 text-blue-700',
  client:     'bg-gray-100 text-gray-600',
};

const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

function ConfirmModal({
  user,
  onConfirm,
  onCancel,
}: {
  user: User;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'oklch(0 0 0 / 0.5)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <IconTrash />
        </div>
        <h3 className="text-center font-bold text-gray-900 mb-1">Eliminar usuario</h3>
        <p className="text-center text-sm text-gray-500 mb-6">
          ¿Seguro que quieres eliminar a <strong>{user.name} {user.lastName1}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

export default function Users() {
  const { user: me } = useAuth();
  const API = import.meta.env.VITE_API_URL;
  const token = sessionStorage.getItem('access_token');

  const [users,   setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  const [roleLoading, setRoleLoading] = useState<string | null>(null);
  const [toDelete,    setToDelete]    = useState<User | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('No se pudo cargar la lista');
      const data = await res.json();
      setUsers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setRoleLoading(userId);
    try {
      const res = await fetch(`${API}/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error('Error al cambiar el rol');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as User['role'] } : u));
      showToast('Rol actualizado correctamente');
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setRoleLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      const res = await fetch(`${API}/users/${toDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al eliminar el usuario');
      setUsers(prev => prev.filter(u => u.id !== toDelete.id));
      showToast(`Usuario ${toDelete.name} eliminado`);
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setToDelete(null);
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = `${u.name} ${u.lastName1} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole   = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const stats = {
    total:      users.length,
    superadmin: users.filter(u => u.role === 'superadmin').length,
    admin:      users.filter(u => u.role === 'admin').length,
    client:     users.filter(u => u.role === 'client').length,
  };

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* Confirm modal */}
      {toDelete && (
        <ConfirmModal
          user={toDelete}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de usuarios</h1>
        <p className="text-sm text-gray-400 mt-1">Administra roles y accesos de todos los usuarios</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',      value: stats.total,      color: 'bg-gray-50 text-gray-700',      dot: 'bg-gray-400' },
          { label: 'Superadmin', value: stats.superadmin, color: 'bg-purple-50 text-purple-700',  dot: 'bg-purple-500' },
          { label: 'Admins',     value: stats.admin,      color: 'bg-blue-50 text-blue-700',      dot: 'bg-blue-500' },
          { label: 'Clientes',   value: stats.client,     color: 'bg-green-50 text-green-700',    dot: 'bg-green-500' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-2xl p-4 flex items-center gap-3`}>
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.dot}`} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs opacity-70">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
        />
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 bg-white"
        >
          <option value="all">Todos los roles</option>
          <option value="superadmin">Superadmin</option>
          <option value="admin">Admin</option>
          <option value="client">Cliente</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6"><Skeleton /></div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="text-gray-500">{error}</p>
            <button onClick={fetchUsers} className="mt-4 text-sm text-green-700 underline">Reintentar</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-gray-500 font-medium">No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3">Usuario</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3">Email</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3">Rol</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">

                    {/* Avatar + nombre */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                          {u.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {u.name} {u.lastName1} {u.lastName2 ?? ''}
                          </p>
                          {u.id === me?.id && (
                            <span className="text-xs text-green-600 font-medium">Tú</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>

                    {/* Rol — select */}
                    <td className="px-6 py-4">
                      {u.id === me?.id ? (
                        // No puedes cambiar tu propio rol
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLOR[u.role]}`}>
                          {ROLE_LABEL[u.role]}
                        </span>
                      ) : (
                        <div className="relative inline-block">
                          {roleLoading === u.id ? (
                            <span className="flex items-center gap-2 text-xs text-gray-400">
                              <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin" />
                              Guardando…
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={e => handleRoleChange(u.id, e.target.value)}
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500/30 ${ROLE_COLOR[u.role]}`}
                            >
                              <option value="superadmin">Superadmin</option>
                              <option value="admin">Admin</option>
                              <option value="client">Cliente</option>
                            </select>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 text-right">
                      {u.id !== me?.id && (
                        <button
                          onClick={() => setToDelete(u)}
                          className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                        >
                          <IconTrash /> Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer con conteo */}
        {!loading && !error && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400">
              Mostrando {filtered.length} de {users.length} usuarios
            </p>
          </div>
        )}
      </div>
    </div>
  );
}