import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateFineDto {
  @Type(() => Number)
  @IsInt({ message: 'loanId debe ser un numero entero' })
  @IsPositive({ message: 'loanId debe ser positivo' })
  loanId: number;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'amount debe ser un numero con hasta 2 decimales' },
  )
  @Min(0, { message: 'amount no puede ser negativo' })
  amount: number;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255, { message: 'El motivo debe tener entre 1 y 255 caracteres' })
  reason: string;

  @IsOptional()
  @IsBoolean()
  paid?: boolean;
}
