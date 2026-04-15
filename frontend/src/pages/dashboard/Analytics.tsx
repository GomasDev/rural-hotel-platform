import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useBookingStats, type BookingStatsFilters } from '../../hooks/useBookingStats';

// ── Helpers ────────────────────────────────────────────────────
const MONTH_SHORT: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
};

function fmtMonth(ym: string) {
  const [, m] = ym.split('-');
  return MONTH_SHORT[m] ?? ym;
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

// ── Tooltip personalizado para ingresos ────────────────────────
function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm shadow-md">
      <p className="mb-1 font-semibold text-gray-700">{label}</p>
      <p className="font-bold text-green-700">{fmtEur(payload[0]?.value ?? 0)}</p>
    </div>
  );
}

// ── Tooltip personalizado para ocupación ──────────────────────
function OccupancyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm shadow-md">
      <p className="mb-1 font-semibold text-gray-700">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-bold">
          {Number(p.value ?? 0).toFixed(1)}%{' '}
          <span className="text-xs font-normal text-gray-400">{p.name}</span>
        </p>
      ))}
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────
export default function AnalyticsPage() {
  const [filters, setFilters] = useState<BookingStatsFilters>({
    from: '2026-01-01',
    to: '2026-04-30',
  });

  const { data, loading, error } = useBookingStats(filters);

  const money = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: data?.currency ?? 'EUR',
    maximumFractionDigits: 0,
  });

  const percent = new Intl.NumberFormat('es-ES', {
    style: 'percent',
    maximumFractionDigits: 1,
  });

  const chartData = (data?.monthly ?? []).map((m) => ({
    ...m,
    label: fmtMonth(m.month),
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analíticas</h1>
        <p className="mt-1 text-sm text-gray-500">
          Métricas de ocupación, ingresos y rendimiento
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
          Filtros
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-gray-700">Desde</span>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm shadow-sm transition focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700/20"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-gray-700">Hasta</span>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm shadow-sm transition focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700/20"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-gray-700">
              Hotel <span className="font-normal text-gray-400">(opcional)</span>
            </span>
            <input
              type="text"
              placeholder="ID del hotel"
              value={filters.hotelId ?? ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  hotelId: e.target.value || undefined,
                })
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm shadow-sm transition focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700/20"
            />
          </label>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white p-12 shadow-sm">
          <svg className="h-5 w-5 animate-spin text-green-700" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="opacity-25"
            />
            <path
              fill="currentColor"
              className="opacity-90"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span className="text-sm text-gray-500">Cargando métricas...</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {data && (
        <>
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
              Resumen del período
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-2xl">📈</span>
                  <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                    {percent.format(data.summary.occupancyRate / 100)}
                  </span>
                </div>
                <p className="tabular-nums text-3xl font-bold text-gray-900">
                  {data.summary.occupancyRate.toFixed(1)}%
                </p>
                <p className="mt-1 text-xs text-gray-400">Tasa de ocupación</p>
                <p className="mt-0.5 text-xs text-gray-300">
                  {data.range.from} → {data.range.to}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-2xl">❌</span>
                  <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                    {percent.format(data.summary.cancellationRate / 100)}
                  </span>
                </div>
                <p className="tabular-nums text-3xl font-bold text-gray-900">
                  {data.summary.cancellationRate.toFixed(1)}%
                </p>
                <p className="mt-1 text-xs text-gray-400">Tasa de cancelación</p>
                <p className="mt-0.5 text-xs text-gray-300">Sobre el total de reservas</p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-2xl">💶</span>
                  <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                    Total
                  </span>
                </div>
                <p className="tabular-nums text-3xl font-bold text-green-700">
                  {money.format(data.summary.totalRevenue)}
                </p>
                <p className="mt-1 text-xs text-gray-400">Ingresos totales</p>
                <p className="mt-0.5 text-xs text-gray-300 tabular-nums">
                  {data.summary.totalBookings} reservas efectivas
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-2xl">🛏️</span>
                </div>
                <p className="text-lg font-semibold leading-snug text-gray-900">
                  {data.summary.mostBookedRoom?.roomName ?? '—'}
                </p>
                <p className="mt-1 text-xs text-gray-400">Habitación más reservada</p>
                <p className="mt-0.5 text-xs text-gray-300 tabular-nums">
                  {data.summary.mostBookedRoom
                    ? `${data.summary.mostBookedRoom.bookings} reservas · ${data.summary.mostBookedRoom.nights} noches`
                    : 'Sin datos en el rango'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
              Tendencias
            </p>

            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Ingresos por mes</h3>
                    <p className="mt-0.5 text-xs text-gray-400">
                      Reservas confirmadas y completadas
                    </p>
                  </div>
                  <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                    {money.format(data.summary.totalRevenue)}
                  </span>
                </div>

                {chartData.length === 0 ? (
                  <div className="flex h-56 items-center justify-center rounded-xl bg-gray-50">
                    <p className="text-sm text-gray-400">Sin datos en el rango seleccionado</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={chartData}
                      barSize={28}
                      margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} stroke="#f3f4f6" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`}
                        tick={{ fontSize: 12, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        width={42}
                      />
                      <Tooltip content={<RevenueTooltip />} cursor={{ fill: '#f0fdf4' }} />
                      <Bar dataKey="revenue" name="Ingresos" fill="#15803d" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Ocupación y cancelación mensual</h3>
                    <p className="mt-0.5 text-xs text-gray-400">Porcentaje mensual por tipo</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-600" />
                      Ocupación
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400" />
                      Cancelación
                    </span>
                  </div>
                </div>

                {chartData.length === 0 ? (
                  <div className="flex h-56 items-center justify-center rounded-xl bg-gray-50">
                    <p className="text-sm text-gray-400">Sin datos en el rango seleccionado</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid stroke="#f3f4f6" strokeDasharray="4 2" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fontSize: 12, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 100]}
                        width={38}
                      />
                      <Tooltip content={<OccupancyTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="occupancyRate"
                        name="Ocupación"
                        stroke="#15803d"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#15803d', strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cancellationRate"
                        name="Cancelación"
                        stroke="#f87171"
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#f87171', strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                        strokeDasharray="5 3"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}