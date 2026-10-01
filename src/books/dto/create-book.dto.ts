import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 200, {
    message: 'El titulo debe tener entre 1 y 200 caracteres',
  })
  title: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 150, {
    message: 'El autor debe tener entre 1 y 150 caracteres',
  })
  author: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 20, {
    message: 'El isbn debe tener entre 10 y 20 caracteres',
  })
  isbn: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100, {
    message: 'La categoria debe tener entre 1 y 100 caracteres',
  })
  category: string;

  @IsInt({ message: 'El anio debe ser un numero entero' })
  @IsPositive({ message: 'El anio debe ser un numero positivo' })
  year: number;

  @IsInt({ message: 'Las copias deben ser un numero entero' })
  @Min(0, { message: 'Las copias no pueden ser negativas' })
  copies: number;
}
