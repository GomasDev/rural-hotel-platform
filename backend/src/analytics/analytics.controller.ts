import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BookingStatsService } from './booking-stats.service';
import { BookingStatsQueryDto } from './dto/booking-stats-query.dto';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly statsService: BookingStatsService) {}

  @Get('stats')
  getStats(
    @Query() dto: BookingStatsQueryDto,
    @Query('hotelId') hotelId?: string,
  ) {
    return this.statsService.getStats(hotelId, dto);
  }
}