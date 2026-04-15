import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { BookingStatsService } from './booking-stats.service';

@Module({
  controllers: [AnalyticsController],
  providers: [BookingStatsService],
})
export class AnalyticsModule {}