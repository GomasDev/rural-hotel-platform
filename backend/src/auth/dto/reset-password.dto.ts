// backend/src/auth/dto/reset-password.dto.ts
import { IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/(?=.*[a-z])/, { message: 'Debe contener al menos una minúscula' })
  @Matches(/(?=.*[A-Z])/, { message: 'Debe contener al menos una mayúscula' })
  @Matches(/(?=.*\d)/, { message: 'Debe contener al menos un número' })
  @Matches(/(?=.*[@$!%*?&._-])/, { message: 'Debe contener al menos un carácter especial (@$!%*?&._-)' })
  newPassword!: string;
}
