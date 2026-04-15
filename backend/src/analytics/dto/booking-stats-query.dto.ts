import { IsOptional, IsUUID, IsDateString } from 'class-validator';

export class BookingStatsQueryDto {
  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @IsDateString()
  from!: string; // yyyy-mm-dd

  @IsDateString()
  to!: string;   // yyyy-mm-dd
}