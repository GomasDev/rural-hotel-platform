import {
  IsString, IsEmail, IsBoolean, IsOptional,
  IsUUID, IsArray, MinLength, MaxLength, IsPhoneNumber
} from 'class-validator';

export class CreateHotelDto {

  @IsOptional() // Se asignará automáticamente en el service
  @IsUUID()
  ownerId?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MaxLength(255)
  address!: string;

  // Formato: "longitude,latitude" → ej: "-3.7038,40.4168"
  @IsString()
  location!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
