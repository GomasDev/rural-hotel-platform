import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { Room }    from '../rooms/entities/room.entity';
import { BookingsService }    from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingStatsService } from '../analytics/booking-stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Room])],
  controllers: [BookingsController],
  providers:   [BookingsService, BookingStatsService],
  exports:     [BookingsService],
})
export class BookingsModule {}