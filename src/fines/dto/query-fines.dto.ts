import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsPositive } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryFinesDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'loanId debe ser un numero entero' })
  @IsPositive({ message: 'loanId debe ser positivo' })
  loanId?: number;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  paid?: boolean;
}
