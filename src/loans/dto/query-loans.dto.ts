import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { LoanStatus } from '../entities/loan.entity';

export class QueryLoansDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(LoanStatus, {
    message: 'status debe ser active, returned u overdue',
  })
  status?: LoanStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'userId debe ser un numero entero' })
  @IsPositive({ message: 'userId debe ser positivo' })
  userId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'bookId debe ser un numero entero' })
  @IsPositive({ message: 'bookId debe ser positivo' })
  bookId?: number;
}
