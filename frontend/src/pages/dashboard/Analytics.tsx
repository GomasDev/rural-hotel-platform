import { useState} from 'react';
import { useBookingStats, type BookingStatsFilters } from '../../hooks/useBookingStats';

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

  return (
    <div className="space-y-8 p-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Analíticas</h1>
        <p className="text-zinc-500">Métricas de ocupación, ingresos y rendimiento</p>
      </header>

      {/* FILTROS */}
      <section className="rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-medium">Filtros</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1">
            <span className="text-sm font-medium">Desde</span>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium">Hasta</span>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium">Hotel (opcional)</span>
            <input
              type="text"
              placeholder="ID del hotel"
              value={filters.hotelId ?? ''}
              onChange={(e) => setFilters({ 
                ...filters, 
                hotelId: e.target.value || undefined 
              })}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>
        </div>
      </section>

      {/* ESTADOS */}
      {loading && (
        <div className="flex items-center justify-center rounded-xl bg-white p-12 shadow-sm dark:bg-zinc-900">
          <div className="text-lg">Cargando métricas...</div>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-6 shadow-sm dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* KPI CARDS */}
      {data && (
        <>
          <section>
            <h2 className="mb-6 text-lg font-medium">Resumen</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* OCUPACIÓN */}
              <article className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm text-zinc-500">Tasa de ocupación</p>
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/50">
                    {percent.format(data.summary.occupancyRate / 100)}
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold tabular-nums text-zinc-900 dark:text-white">
                  {data.summary.occupancyRate.toFixed(1)}%
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Promedio del rango {data.range.from} → {data.range.to}
                </p>
              </article>

              {/* CANCELACIÓN */}
              <article className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm text-zinc-500">Tasa de cancelación</p>
                  <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900/50">
                    {percent.format(data.summary.cancellationRate / 100)}
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold tabular-nums text-zinc-900 dark:text-white">
                  {data.summary.cancellationRate.toFixed(1)}%
                </p>
                <p className="mt-1 text-xs text-zinc-500">Canceladas sobre total de reservas</p>
              </article>

              {/* INGRESO MEDIO */}
              <article className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900">
                <p className="text-sm text-zinc-500">Ingreso medio por noche</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-zinc-900 dark:text-white">
                  {money.format(data.summary.avgRevenuePerNight)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">Ingresos ÷ reservas efectivas</p>
              </article>

              {/* HABITACIÓN MÁS RESERVADA */}
              <article className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900">
                <p className="text-sm text-zinc-500">Habitación más reservada</p>
                <p className="mt-3 text-xl font-semibold text-zinc-900 dark:text-white">
                  {data.summary.mostBookedRoom?.roomName ?? '—'}
                </p>
                <p className="mt-1 text-xs text-zinc-500 tabular-nums">
                  {data.summary.mostBookedRoom
                    ? `${data.summary.mostBookedRoom.bookings} reservas · ${data.summary.mostBookedRoom.nights} noches`
                    : 'Sin datos en el rango'}
                </p>
              </article>
            </div>
          </section>

          {/* GRÁFICAS - ESPACIO RESERVADO */}
          <section>
            <h2 className="mb-6 text-lg font-medium">Tendencias</h2>
            <div className="space-y-6">
              <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-900">
                <h3 className="mb-4 text-lg font-medium">Ingresos por mes</h3>
                <div className="h-64 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  {/* Gráfica de barras aquí */}
                  <p className="flex items-center justify-center h-full text-zinc-500">
                    Gráfica de ingresos (Próximamente)
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-900">
                <h3 className="mb-4 text-lg font-medium">Ocupación mensual</h3>
                <div className="h-64 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  {/* Gráfica de línea aquí */}
                  <p className="flex items-center justify-center h-full text-zinc-500">
                    Gráfica de ocupación (Próximamente)
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}