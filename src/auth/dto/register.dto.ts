import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsEmail({}, { message: 'El email no tiene un formato valido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contrasenia debe tener al menos 8 caracteres' })
  @MaxLength(72, { message: 'La contrasenia no puede superar 72 caracteres' })
  password: string;
}
