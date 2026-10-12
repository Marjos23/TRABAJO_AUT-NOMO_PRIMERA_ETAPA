import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const ORDENES = ['ASC', 'DESC'] as const;
export type Orden = (typeof ORDENES)[number];

export const LIMITE_POR_DEFECTO = 10;
export const LIMITE_MAXIMO = 100;

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page debe ser un numero entero' })
  @Min(1, { message: 'page debe ser mayor o igual a 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un numero entero' })
  @Min(1, { message: 'limit debe ser mayor o igual a 1' })
  @Max(LIMITE_MAXIMO, {
    message: `limit no puede superar ${LIMITE_MAXIMO}`,
  })
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(ORDENES, { message: 'order debe ser ASC o DESC' })
  order?: Orden;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function normalizarPaginacion(query: PaginationQueryDto): {
  page: number;
  limit: number;
  skip: number;
  order: Orden;
} {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit =
    query.limit && query.limit > 0
      ? Math.min(query.limit, LIMITE_MAXIMO)
      : LIMITE_POR_DEFECTO;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    order: query.order ?? 'ASC',
  };
}

export function construirResultadoPaginado<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
