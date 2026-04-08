import {
  IsString, IsOptional, IsBoolean, IsNumber,
  MaxLength, Min, IsEnum, IsArray, IsUrl, IsNotEmpty,
} from 'class-validator';
import { Difficulty } from '../entities/hiking-route.entity';

export class CreateHikingRouteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsNumber()
  @Min(0.1)
  distanceKm: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  elevationGainM?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  durationMinutes?: number;

  // GeoJSON LineString como string WKT, ej: "LINESTRING(lng lat, lng lat, ...)"
  @IsString()
  @IsNotEmpty()
  routeGeom: string;

  @IsOptional()
  @IsUrl()
  gpxFileUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}