import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { Room }    from '../rooms/entities/room.entity';
import { BookingsService }    from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingStatsService } from '../analytics/booking-stats.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Room]), MailModule],
  controllers: [BookingsController],
  providers:   [BookingsService, BookingStatsService],
  exports:     [BookingsService],
})
export class BookingsModule {}