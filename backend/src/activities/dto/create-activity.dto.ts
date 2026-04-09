import {
  IsString, IsOptional, IsBoolean, IsNumber,
  IsEnum, IsArray, MaxLength, Min, IsNotEmpty,
} from 'class-validator';
import { ActivityCategory } from '../entities/activity.entity';

export class CreateActivityDto {
  @IsString() @IsNotEmpty() @MaxLength(150) name!: string;
  @IsOptional() @IsString() description?: string;
  @IsEnum(ActivityCategory) category!: ActivityCategory;
  @IsOptional() @IsNumber() @Min(0) pricePerPerson?: number;
  @IsOptional() @IsNumber() @Min(1) maxParticipants?: number;
  @IsOptional() @IsNumber() @Min(1) durationMinutes?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  @IsOptional() @IsBoolean() isActive?: boolean;
}