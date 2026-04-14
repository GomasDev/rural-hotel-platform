import { IsEmail, IsOptional, IsString, MinLength, Matches } from 'class-validator';
import type { UserRole } from '../../database/types';

export class RegisterDto {
  @IsString()
  name!: string;

  @IsString()
  lastName1!: string;

  @IsOptional()
  @IsString()
  lastName2?: string;

  @IsEmail()
  email!: string;

@IsString()
@MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
@Matches(/(?=.*[a-z])/, { message: 'Debe contener al menos una minúscula' })
@Matches(/(?=.*[A-Z])/, { message: 'Debe contener al menos una mayúscula' })
@Matches(/(?=.*\d)/, { message: 'Debe contener al menos un número' })
@Matches(/(?=.*[@$!%*?&._-])/, { message: 'Debe contener al menos un carácter especial (@$!%*?&._-)' })
password!: string;

  @IsOptional()
  role?: UserRole;
}
