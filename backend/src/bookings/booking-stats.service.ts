import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BookingStatsQueryDto } from './dto/booking-stats-query.dto';

@Injectable()
export class BookingStatsService {
  constructor(private readonly dataSource: DataSource) {}

  async getStats(hotelId: string | undefined, dto: BookingStatsQueryDto) {
    const { from, to } = dto;
    const params = hotelId ? [from, to, hotelId] : [from, to];
    const hotelFilter = hotelId ? 'AND r.hotel_id = $3' : '';

    // ── Query 1: ingresos y reservas por mes ─────────────────────────────────
    const monthlyRevenue: any[] = await this.dataSource.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', b.check_in), 'YYYY-MM') AS month,
        COALESCE(SUM(b.total_price), 0)::float               AS revenue,
        COUNT(*)::int                                         AS bookings
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      WHERE b.status IN ('confirmed', 'completed')
        AND b.check_in >= $1::date
        AND b.check_in <= $2::date
        ${hotelFilter}
      GROUP BY 1
      ORDER BY 1
    `, params);

    // ── Query 2: cancelaciones por mes ───────────────────────────────────────
    const monthlyCancellation: any[] = await this.dataSource.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', b.check_in), 'YYYY-MM') AS month,
        COUNT(*)::int                                         AS total,
        COUNT(*) FILTER (WHERE b.status = 'cancelled')::int  AS cancelled
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      WHERE b.check_in >= $1::date
        AND b.check_in <= $2::date
        ${hotelFilter}
      GROUP BY 1
      ORDER BY 1
    `, params);

    // ── Query 3: ocupación por mes ────────────────────────────────────────────
    // noches_ocupadas / (nº habitaciones * días del mes) * 100
    const monthlyOccupancy: any[] = await this.dataSource.query(`
      WITH months AS (
        SELECT generate_series(
          DATE_TRUNC('month', $1::date),
          DATE_TRUNC('month', $2::date),
          '1 month'
        ) AS month_start
      ),
      room_count AS (
        SELECT COUNT(*)::int AS total
        FROM rooms r
        WHERE r.is_available = true
        ${hotelFilter}
      ),
      occupied AS (
        SELECT
          DATE_TRUNC('month', d::date)           AS month_start,
          COUNT(DISTINCT (b.room_id, d::date))::int AS nights_occupied
        FROM bookings b
        JOIN rooms r ON r.id = b.room_id,
          generate_series(b.check_in, b.check_out - INTERVAL '1 day', '1 day') AS d
        WHERE b.status IN ('confirmed', 'completed')
          AND d::date >= $1::date
          AND d::date <= $2::date
          ${hotelFilter}
        GROUP BY 1
      )
      SELECT
        TO_CHAR(m.month_start, 'YYYY-MM') AS month,
        COALESCE(
          ROUND(
            o.nights_occupied::numeric /
            NULLIF(
              rc.total * DATE_PART('day',
                (m.month_start + INTERVAL '1 month') - m.month_start
              ),
              0
            ) * 100,
            1
          ),
          0
        )::float AS occupancy_rate
      FROM months m
      CROSS JOIN room_count rc
      LEFT JOIN occupied o ON o.month_start = m.month_start
      ORDER BY m.month_start
    `, params);

    // ── Query 4: habitación más reservada ────────────────────────────────────
    const mostBookedRoomRows: any[] = await this.dataSource.query(`
      SELECT
        r.id                            AS "roomId",
        r.name                          AS "roomName",
        COUNT(b.id)::int                AS bookings,
        SUM(b.check_out - b.check_in)::int AS nights
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      WHERE b.status IN ('confirmed', 'completed')
        AND b.check_in >= $1::date
        AND b.check_in <= $2::date
        ${hotelFilter}
      GROUP BY r.id, r.name
      ORDER BY bookings DESC, nights DESC
      LIMIT 1
    `, params);

    // ── Merge: construir array mensual completo ───────────────────────────────
    const allMonths = this.buildMonthRange(from, to);
    const revMap   = new Map(monthlyRevenue.map(r => [r.month, r]));
    const cancMap  = new Map(monthlyCancellation.map(r => [r.month, r]));
    const occMap   = new Map(monthlyOccupancy.map(r => [r.month, r]));

    const monthly = allMonths.map(month => {
      const rev  = revMap.get(month)  ?? { revenue: 0, bookings: 0 };
      const canc = cancMap.get(month) ?? { total: 0, cancelled: 0 };
      const occ  = occMap.get(month)  ?? { occupancy_rate: 0 };
      return {
        month,
        revenue:           parseFloat(rev.revenue)    || 0,
        bookings:          rev.bookings                || 0,
        occupancyRate:     occ.occupancy_rate          || 0,
        cancellationRate:  canc.total > 0
          ? parseFloat(((canc.cancelled / canc.total) * 100).toFixed(1))
          : 0,
        avgRevenuePerNight: rev.bookings > 0
          ? parseFloat((rev.revenue / rev.bookings).toFixed(2))
          : 0,
      };
    });

    // ── Summary ───────────────────────────────────────────────────────────────
    const totalRevenue   = monthly.reduce((s, m) => s + m.revenue, 0);
    const totalBookings  = monthly.reduce((s, m) => s + m.bookings, 0);
    const avgOccupancy   = monthly.length
      ? parseFloat((monthly.reduce((s, m) => s + m.occupancyRate, 0) / monthly.length).toFixed(1))
      : 0;
    const totalAll       = monthlyCancellation.reduce((s, r) => s + r.total, 0);
    const totalCancelled = monthlyCancellation.reduce((s, r) => s + r.cancelled, 0);

    return {
      range:    { from, to },
      hotelId:  hotelId ?? null,
      currency: 'EUR',
      monthly,
      summary: {
        totalRevenue:       parseFloat(totalRevenue.toFixed(2)),
        totalBookings,
        occupancyRate:      avgOccupancy,
        cancellationRate:   totalAll > 0
          ? parseFloat(((totalCancelled / totalAll) * 100).toFixed(1))
          : 0,
        avgRevenuePerNight: totalBookings > 0
          ? parseFloat((totalRevenue / totalBookings).toFixed(2))
          : 0,
        mostBookedRoom: mostBookedRoomRows[0] ?? null,
      },
    };
  }

  // Genera ['2026-01', '2026-02', ...] entre from y to
  private buildMonthRange(from: string, to: string): string[] {
    const months: string[] = [];
    const current = new Date(from);
    const end     = new Date(to);
    current.setDate(1);
    end.setDate(1);
    while (current <= end) {
      months.push(current.toISOString().slice(0, 7));
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  }
}