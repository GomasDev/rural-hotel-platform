import { useEffect, useState } from 'react';

interface Day { date: string; code: number; max: number; min: number; }

const ICONS: Record<number, string> = {
  0:'☀️', 1:'🌤️', 2:'⛅', 3:'☁️',
  45:'🌫️', 48:'🌫️',
  51:'🌦️', 53:'🌦️', 55:'🌧️',
  61:'🌧️', 63:'🌧️', 65:'🌧️',
  71:'🌨️', 73:'🌨️', 75:'❄️', 77:'❄️',
  80:'🌦️', 81:'🌧️', 82:'⛈️',
  95:'⛈️', 96:'⛈️', 99:'⛈️',
};

const DESC: Record<number, string> = {
  0:'Despejado', 1:'Casi despejado', 2:'Parcial nublado', 3:'Nublado',
  45:'Niebla', 48:'Niebla',
  51:'Llovizna', 53:'Llovizna', 55:'Llovizna fuerte',
  61:'Lluvia suave', 63:'Lluvia', 65:'Lluvia fuerte',
  71:'Nieve suave', 73:'Nieve', 75:'Nieve fuerte',
  80:'Chubascos', 81:'Chubascos', 82:'Chubascos fuertes',
  95:'Tormenta', 96:'Tormenta', 99:'Tormenta fuerte',
};

const BG: (code: number) => string = (code) => {
  if (code === 0 || code === 1) return 'from-yellow-50 to-orange-50 border-orange-100';
  if (code <= 3)                return 'from-gray-50 to-slate-100 border-slate-200';
  if (code <= 48)               return 'from-slate-50 to-gray-100 border-gray-200';
  if (code <= 67)               return 'from-blue-50 to-sky-100 border-blue-100';
  if (code <= 77)               return 'from-slate-50 to-blue-100 border-blue-100';
  return                               'from-gray-100 to-slate-200 border-slate-200';
};

const DAYS_ES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

export default function WeatherWidget({ lat, lng, forecastDays = 5 }: {
  lat: number; lng: number; forecastDays?: number;
}) {
  const [data, setData]    = useState<Day[] | null>(null);
  const [loading, setLoad] = useState(true);
  const [error, setError]  = useState(false);

  useEffect(() => {
    setLoad(true); setError(false);
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=${forecastDays}`
    )
      .then(r => r.json())
      .then(d => setData(d.daily.time.map((date: string, i: number) => ({
        date, code: d.daily.weathercode[i],
        max: Math.round(d.daily.temperature_2m_max[i]),
        min: Math.round(d.daily.temperature_2m_min[i]),
      }))))
      .catch(() => setError(true))
      .finally(() => setLoad(false));
  }, [lat, lng, forecastDays]);

  if (loading) return (
    <div className="flex gap-2 animate-pulse">
      {[...Array(forecastDays)].map((_, i) => (
        <div key={i} className="flex-1 h-24 bg-gray-100 rounded-2xl" />
      ))}
    </div>
  );

  if (error || !data) return (
    <p className="text-xs text-gray-400 text-center py-3">Tiempo no disponible para esta ubicación</p>
  );

  return (
    <div className="flex gap-1.5">
      {data.map((day, i) => {
        const d     = new Date(day.date + 'T12:00:00');
        const label = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : DAYS_ES[d.getDay()];
        return (
          <div key={i} className={`flex-1 flex flex-col items-center bg-gradient-to-b ${BG(day.code)} border rounded-2xl py-3 px-1 gap-0.5`}>
            <span className="text-xs font-medium text-gray-500">{label}</span>
            <span className="text-xl my-1">{ICONS[day.code] ?? '🌡️'}</span>
            <span className="text-xs text-gray-400 text-center leading-tight hidden sm:block px-1">{DESC[day.code] ?? ''}</span>
            <span className="text-sm font-bold text-gray-800">{day.max}°C</span>
            <span className="text-xs text-gray-400">{day.min}°C</span>
          </div>
        );
      })}
    </div>
  );
}