import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryBooksDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'year debe ser un numero entero' })
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'minCopies debe ser un numero entero' })
  @Min(0, { message: 'minCopies no puede ser negativo' })
  minCopies?: number;
}
