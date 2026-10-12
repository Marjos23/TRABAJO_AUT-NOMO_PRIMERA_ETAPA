import 'reflect-metadata';
import {
  construirResultadoPaginado,
  normalizarPaginacion,
} from './pagination-query.dto';

describe('pagination-query.dto', () => {
  describe('normalizarPaginacion', () => {
    it('aplica valores por defecto', () => {
      expect(normalizarPaginacion({})).toEqual({
        page: 1,
        limit: 10,
        skip: 0,
        order: 'ASC',
      });
    });

    it('calcula skip y respeta los limites', () => {
      expect(
        normalizarPaginacion({ page: 3, limit: 5, order: 'DESC' }),
      ).toEqual({ page: 3, limit: 5, skip: 10, order: 'DESC' });
    });

    it('limita el maximo de resultados por pagina', () => {
      expect(normalizarPaginacion({ limit: 500 }).limit).toBe(100);
    });
  });

  describe('construirResultadoPaginado', () => {
    it('incluye metadatos de paginacion', () => {
      const resultado = construirResultadoPaginado([1, 2], 5, 1, 2);

      expect(resultado.data).toEqual([1, 2]);
      expect(resultado.meta).toEqual({
        page: 1,
        limit: 2,
        total: 5,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: false,
      });
    });

    it('maneja colecciones vacias', () => {
      const resultado = construirResultadoPaginado([], 0, 1, 10);
      expect(resultado.meta.totalPages).toBe(0);
      expect(resultado.meta.hasNextPage).toBe(false);
    });
  });
});
