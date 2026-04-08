import { useEffect, useState } from 'react';

interface Room {
  id: string;
  hotelId: string;
  name: string;
  description?: string;
  capacity: number;
  pricePerNight: number;
  images?: string[];
  isAvailable: boolean;
}

const EMPTY_FORM = {
  name: '',
  description: '',
  capacity: 1,
  pricePerNight: 0,
  images: [] as string[],
  isAvailable: true,
};

interface Props {
  hotelId: string;
  hotelName: string;
  token: string | null;
  onClose: () => void;
}

export default function HotelRooms({ hotelId, hotelName, token, onClose }: Props) {
  const [rooms, setRooms]           = useState<Room[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<Room | null>(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [imageInput, setImageInput] = useState('');
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');

  const API = import.meta.env.VITE_API_URL;

  // ── Fetch habitaciones ────────────────────────────────────────────────────
  const fetchRooms = () => {
    setLoading(true);
    fetch(`${API}/rooms/hotel/${hotelId}`)
      .then(res => { if (!res.ok) throw new Error('Error al cargar habitaciones'); return res.json(); })
      .then(data => setRooms(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRooms(); }, [hotelId]);

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImageInput('');
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (room: Room) => {
    setEditing(room);
    setForm({
      name:           room.name,
      description:    room.description ?? '',
      capacity:       room.capacity,
      pricePerNight:  room.pricePerNight,
      images:         room.images ?? [],
      isAvailable:    room.isAvailable,
    });
    setImageInput('');
    setFormError('');
    setModalOpen(true);
  };

  // ── Imágenes ──────────────────────────────────────────────────────────────
  const addImage = () => {
    const url = imageInput.trim();
    if (!url) return;
    if (!/^https?:\/\/.+/.test(url)) { setFormError('La URL debe comenzar por http:// o https://'); return; }
    setForm(f => ({ ...f, images: [...f.images, url] }));
    setImageInput('');
    setFormError('');
  };

  const removeImage = (index: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  // ── Guardar ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name) { setFormError('El nombre es obligatorio'); return; }
    if (form.capacity < 1) { setFormError('La capacidad debe ser al menos 1'); return; }
    if (form.pricePerNight <= 0) { setFormError('El precio debe ser mayor que 0'); return; }

    setSaving(true);
    setFormError('');

    const url    = editing
      ? `${API}/rooms/${editing.id}`
      : `${API}/rooms`;
    const method = editing ? 'PATCH' : 'POST';
    const body   = editing ? form : { ...form, hotelId };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message ?? 'Error al guardar'); }
      setModalOpen(false);
      fetchRooms();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Eliminar ──────────────────────────────────────────────────────────────
  const handleDelete = async (room: Room) => {
    if (!confirm(`¿Eliminar "${room.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`${API}/rooms/${room.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al eliminar');
      fetchRooms();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Habitaciones</h2>
            <p className="text-sm text-gray-500 mt-0.5">{hotelName}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={openCreate}
              className="px-4 py-2 bg-green-700 text-white rounded-xl text-sm font-medium hover:bg-green-800 transition flex items-center gap-2">
              <span>＋</span> Nueva habitación
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl p-5 animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-lg mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">⚠️</p>
              <p className="text-red-600">{error}</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">🛏️</p>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Sin habitaciones</h3>
              <p className="text-gray-500 text-sm mb-6">Este hotel no tiene habitaciones todavía.</p>
              <button onClick={openCreate}
                className="px-5 py-2 bg-green-700 text-white rounded-xl text-sm hover:bg-green-800 transition">
                Crear primera habitación
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map(room => (
                <div key={room.id} className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                  <div className="h-36 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                    {room.images?.[0]
                      ? <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover" loading="lazy" />
                      : <span className="text-4xl">🛏️</span>
                    }
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 leading-tight">{room.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${room.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {room.isAvailable ? 'Disponible' : 'Ocupada'}
                      </span>
                    </div>
                    {room.description && (
                      <p className="text-gray-500 text-xs mb-3 line-clamp-2">{room.description}</p>
                    )}
                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      <p className="flex items-center gap-2">
                        <span>👥</span>
                        {room.capacity} persona{room.capacity !== 1 ? 's' : ''}
                      </p>
                      <p className="flex items-center gap-2">
                        <span>💶</span>
                        <span className="font-semibold text-gray-800">{Number(room.pricePerNight).toFixed(2)} €</span>
                        <span className="text-gray-400 text-xs">/ noche</span>
                      </p>
                      {room.images && room.images.length > 0 && (
                        <p className="flex items-center gap-2">
                          <span>🖼️</span>{room.images.length} imagen{room.images.length !== 1 ? 'es' : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100">
                      <button onClick={() => openEdit(room)}
                        className="flex-1 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                        ✏️ Editar
                      </button>
                      <button onClick={() => handleDelete(room)}
                        className="flex-1 py-1.5 text-sm border border-red-100 rounded-lg text-red-600 hover:bg-red-50 transition">
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal crear / editar ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-bold text-gray-800">
                {editing ? 'Editar habitación' : 'Nueva habitación'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{formError}</p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad *</label>
                  <input type="number" min="1" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio por noche (€) *</label>
                  <input type="number" min="0" step="0.01" value={form.pricePerNight} onChange={e => setForm(f => ({ ...f, pricePerNight: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isAvailable} onChange={e => setForm(f => ({ ...f, isAvailable: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  <span className="text-sm font-medium text-gray-700">Disponible</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imágenes</label>
                <div className="flex gap-2 mb-2">
                  <input type="url" value={imageInput} onChange={e => setImageInput(e.target.value)} placeholder="https://..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                  <button onClick={addImage} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">＋</button>
                </div>
                {form.images.length > 0 && (
                  <div className="space-y-1">
                    {form.images.map((img, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="flex-1 truncate">{img}</span>
                        <button onClick={() => removeImage(i)} className="text-red-500 hover:text-red-700">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}