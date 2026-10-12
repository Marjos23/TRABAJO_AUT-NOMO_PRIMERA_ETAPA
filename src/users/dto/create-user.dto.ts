import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 150, { message: 'El nombre debe tener entre 1 y 150 caracteres' })
  name: string;

  @IsEmail({}, { message: 'El email no tiene un formato valido' })
  @MaxLength(150)
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contrasenia debe tener al menos 8 caracteres' })
  @MaxLength(72, { message: 'La contrasenia no puede superar 72 caracteres' })
  password: string;

  @IsOptional()
  @IsEnum(UserRole, {
    message: 'El rol debe ser librarian o reader',
  })
  role?: UserRole;
}
