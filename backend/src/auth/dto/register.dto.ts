import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import type { UserRole } from '../../database/types';

export class RegisterDto {
  @IsString()
  name: string;

  @IsString()
  lastName1: string;

  @IsOptional()
  @IsString()
  lastName2?: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  role?: UserRole;
}
