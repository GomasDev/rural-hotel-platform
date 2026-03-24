import { IsEnum } from 'class-validator';
import { BookingStatus } from '../entities/reservation.entity';

export class UpdateBookingStatusDto {

  @IsEnum(BookingStatus)
  status: BookingStatus;
}