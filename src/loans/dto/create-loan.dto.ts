import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { LoanStatus } from '../entities/loan.entity';

export class CreateLoanDto {
  @Type(() => Number)
  @IsInt({ message: 'bookId debe ser un numero entero' })
  @IsPositive({ message: 'bookId debe ser positivo' })
  bookId: number;

  @Type(() => Number)
  @IsInt({ message: 'userId debe ser un numero entero' })
  @IsPositive({ message: 'userId debe ser positivo' })
  userId: number;

  @IsOptional()
  @IsDateString({}, { message: 'loanDate debe ser una fecha ISO 8601' })
  loanDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'dueDate debe ser una fecha ISO 8601' })
  dueDate?: string;

  @IsOptional()
  @IsEnum(LoanStatus, {
    message: 'status debe ser active, returned u overdue',
  })
  status?: LoanStatus;
}
