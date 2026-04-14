import { IsEnum } from 'class-validator';
import { BookingStatus } from '../../bookings/entities/booking.entity';
import { Column } from 'typeorm/decorator/columns/Column.js';

export class UpdateBookingStatusDto {

  @IsEnum(BookingStatus)
  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.Pending })
  status!: BookingStatus;
}