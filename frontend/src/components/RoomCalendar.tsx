import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import './RoomCalendar.css';

interface OccupiedRange { checkIn: string; checkOut: string; }

interface Props {
  roomId: string;
  value: [Date, Date] | null;
  onChange: (range: [Date, Date]) => void;
  readOnly?: boolean;
}

function isOccupied(date: Date, ranges: OccupiedRange[]): boolean {
  const d = date.getTime();
  return ranges.some(r => {
    const s = new Date(r.checkIn).getTime();
    const e = new Date(r.checkOut).getTime();
    return d >= s && d < e;
  });
}

export default function RoomCalendar({ roomId, value, onChange, readOnly = false }: Props) {
  const [occupied, setOccupied] = useState<OccupiedRange[]>([]);
  const [loading,  setLoading]  = useState(true);
  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetch(`${API}/rooms/${roomId}/occupied-dates`)
      .then(r => r.json())
      .then(d => setOccupied(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [roomId]);

  if (loading) return (
    <div className="h-64 animate-pulse bg-gray-100 rounded-2xl flex items-center justify-center text-gray-300 text-sm">
      Cargando disponibilidad…
    </div>
  );

  return (
    <div className="rcal">
      <Calendar
        selectRange={!readOnly}
        value={value}
        onChange={(val: any) => {
          if (!readOnly && Array.isArray(val) && val[0] && val[1]) {
            onChange([val[0] as Date, val[1] as Date]);
          }
        }}
        minDate={readOnly ? undefined : new Date()}
        tileDisabled={({ date, view }) =>
          !readOnly && view === 'month' && (
            date < new Date(new Date().setHours(0,0,0,0)) ||
            isOccupied(date, occupied)
          )
        }
        tileClassName={({ date, view }) => {
          if (view !== 'month') return null;
          if (isOccupied(date, occupied)) return 'tile-occupied';
          return null;
        }}
        locale="es-ES"
      />

      {/* Leyenda */}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 justify-center">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-green-100 border border-green-300 inline-block" />
          Rango seleccionado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-100 border border-red-300 inline-block" />
          Ocupado
        </span>
      </div>
    </div>
  );
}