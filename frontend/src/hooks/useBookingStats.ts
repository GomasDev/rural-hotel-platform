import { useEffect, useState } from 'react';

export type BookingStatsFilters = {
  from: string;
  to: string;
  hotelId?: string;
};

export type MonthlyBookingStat = {
  month: string;
  revenue: number;
  bookings: number;
  occupancyRate: number;
  cancellationRate: number;
  avgRevenuePerNight: number;
};

export type BookingStatsResponse = {
  range: { from: string; to: string };
  hotelId: string | null;
  currency: string;
  monthly: MonthlyBookingStat[];
  summary: {
    totalRevenue: number;
    totalBookings: number;
    occupancyRate: number;
    cancellationRate: number;
    avgRevenuePerNight: number;
    mostBookedRoom: {
      roomId: string;
      roomName: string;
      bookings: number;
      nights: number;
    } | null;
  };
};

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useBookingStats(filters: BookingStatsFilters) {
  const [data, setData] = useState<BookingStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchStats = async () => {
      if (!filters.from || !filters.to) return;

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          from: filters.from,
          to: filters.to,
        });

        if (filters.hotelId) {
          params.set('hotelId', filters.hotelId);
        }

        const token = localStorage.getItem('token');

        const res = await fetch(`${API_URL}/bookings/stats?${params.toString()}`, {
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!res.ok) {
          throw new Error('No se pudieron cargar las métricas');
        }

        const json = (await res.json()) as BookingStatsResponse;
        setData(json);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message ?? 'Error desconocido');
          setData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    return () => controller.abort();
  }, [filters.from, filters.to, filters.hotelId]);

  return { data, loading, error };
}