import {
  IsString, IsInt, IsNumber, IsBoolean,
  IsOptional, IsUUID, IsArray,
  MinLength, MaxLength, Min, Max
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoomDto {
  @IsUUID()
  hotelId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  capacity: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  pricePerNight: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
