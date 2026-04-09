import { useEffect, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
export const ActivityCategory = {
  ADVENTURE:  'adventure',
  WATER:      'water',
  CULTURE:    'culture',
  GASTRONOMY: 'gastronomy',
  WELLNESS:   'wellness',
  OTHER:      'other',
} as const;

export type ActivityCategory = typeof ActivityCategory[keyof typeof ActivityCategory];

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  adventure:  'Aventura',
  water:      'Agua',
  culture:    'Cultura',
  gastronomy: 'Gastronomía',
  wellness:   'Bienestar',
  other:      'Otro',
};

const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  adventure:  'bg-orange-100 text-orange-700',
  water:      'bg-blue-100 text-blue-700',
  culture:    'bg-purple-100 text-purple-700',
  gastronomy: 'bg-yellow-100 text-yellow-700',
  wellness:   'bg-green-100 text-green-700',
  other:      'bg-gray-100 text-gray-600',
};

interface Activity {
  id: string;
  hotelId: string;
  name: string;
  description: string | null;
  category: ActivityCategory;
  pricePerPerson: number | null;
  maxParticipants: number | null;
  durationMinutes: number | null;
  images: string[] | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type ActivityForm = Omit<Activity, 'id' | 'hotelId' | 'createdAt' | 'updatedAt'>;

const EMPTY_FORM: ActivityForm = {
  name:            '',
  description:     null,
  category:        ActivityCategory.OTHER,
  pricePerPerson:  null,
  maxParticipants: null,
  durationMinutes: null,
  images:          null,
  isActive:        true,
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

function formatMinutes(min: number | null): string {
  if (min === null) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<Activity | null>(null);
  const [form, setForm]             = useState<ActivityForm>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);
  const [deleting, setDeleting]         = useState(false);

  // ── Data fetching ────────────────────────────────────────────────────────────
  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<Activity[]>('/activities');
      setActivities(data);
    } catch (e) {
      setError('No se pudieron cargar las actividades.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchActivities(); }, []);

  // ── Modal helpers ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (activity: Activity) => {
    setEditing(activity);
    setForm({
      name:            activity.name,
      description:     activity.description,
      category:        activity.category,
      pricePerPerson:  activity.pricePerPerson,
      maxParticipants: activity.maxParticipants,
      durationMinutes: activity.durationMinutes,
      images:          activity.images,
      isActive:        activity.isActive,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox'
        ? checked
        : type === 'number'
          ? (value === '' ? null : Number(value))
          : (value === '' ? null : value),
    }));
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('El nombre es obligatorio.'); return; }

    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await apiFetch(`/activities/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch('/activities', {
          method: 'POST',
          body: JSON.stringify(form),
        });
      }
      closeModal();
      await fetchActivities();
    } catch (e) {
      setFormError('Error al guardar la actividad. Inténtalo de nuevo.');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/activities/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      await fetchActivities();
    } catch {
      alert('Error al eliminar la actividad.');
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Actividades</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activities.length} actividad{activities.length !== 1 ? 'es' : ''} registrada{activities.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva actividad
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
          <button onClick={fetchActivities} className="ml-2 underline">Reintentar</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Cargando actividades…
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <svg className="w-10 h-10 opacity-40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <p className="text-sm font-medium text-gray-500">No hay actividades todavía</p>
            <button onClick={openCreate} className="text-sm text-teal-600 hover:underline">
              Crea la primera actividad
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Categoría</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Precio / persona</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Duración</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Participantes máx.</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activities.map(activity => (
                  <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{activity.name}</div>
                      {activity.description && (
                        <div className="text-xs text-gray-400 truncate max-w-xs">{activity.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[activity.category]}`}>
                        {CATEGORY_LABELS[activity.category]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {activity.pricePerPerson !== null
                        ? `${Number(activity.pricePerPerson).toFixed(2)} €`
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatMinutes(activity.durationMinutes)}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {activity.maxParticipants ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {activity.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          Inactiva
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(activity)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(activity)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-y-auto max-h-[90vh]">
            <form onSubmit={handleSave}>
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editing ? 'Editar actividad' : 'Nueva actividad'}
                </h2>
                <button type="button" onClick={closeModal} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal body */}
              <div className="px-6 py-5 space-y-4">
                {formError && (
                  <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                    {formError}
                  </p>
                )}

                {/* Nombre */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name" type="text" required maxLength={150}
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Ej: Kayak por el río"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
                  />
                </div>

                {/* Categoría */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Categoría</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition bg-white"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Descripción */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    name="description" rows={3}
                    value={form.description ?? ''}
                    onChange={handleChange}
                    placeholder="Descripción opcional de la actividad…"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition resize-none"
                  />
                </div>

                {/* Precio / Duración */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Precio por persona (€)</label>
                    <input
                      name="pricePerPerson" type="number" min={0} step={0.01}
                      value={form.pricePerPerson ?? ''}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Duración (minutos)</label>
                    <input
                      name="durationMinutes" type="number" min={1}
                      value={form.durationMinutes ?? ''}
                      onChange={handleChange}
                      placeholder="60"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
                    />
                  </div>
                </div>

                {/* Participantes máx. */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Participantes máximos</label>
                  <input
                    name="maxParticipants" type="number" min={1}
                    value={form.maxParticipants ?? ''}
                    onChange={handleChange}
                    placeholder="Sin límite"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
                  />
                </div>

                {/* Activa */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox" name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Actividad activa</span>
                </label>
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                <button
                  type="button" onClick={closeModal}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit" disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  {saving && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  {editing ? 'Guardar cambios' : 'Crear actividad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ───────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Eliminar actividad</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700">
              ¿Seguro que quieres eliminar <span className="font-medium">"{deleteTarget.name}"</span>?
            </p>
            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete} disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}