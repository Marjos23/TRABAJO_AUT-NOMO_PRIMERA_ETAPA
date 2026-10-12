import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { QueryFailedError } from 'typeorm';
import { Loan } from '../loans/entities/loan.entity';
import { BooksService } from './books.service';
import { Book } from './entities/book.entity';

const libroExistente: Book = {
  id: 1,
  title: 'Clean Code',
  author: 'Robert C. Martin',
  isbn: '9780132350884',
  category: 'Tecnologia',
  year: 2008,
  copies: 5,
  loans: [],
};

function errorDeIsbnDuplicado(): QueryFailedError {
  return new QueryFailedError('INSERT INTO "books"', [], {
    code: '23505',
    message: 'duplicate key value violates unique constraint "UQ_books_isbn"',
  } as never);
}

describe('BooksService', () => {
  let service: BooksService;
  let repository: Record<string, jest.Mock>;
  let queryBuilder: Record<string, jest.Mock>;

  beforeEach(async () => {
    queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[libroExistente], 1]),
    };

    repository = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto })),
      save: jest.fn().mockImplementation((libro) => libro),
      find: jest.fn().mockResolvedValue([libroExistente]),
      findAndCount: jest.fn().mockResolvedValue([[libroExistente], 1]),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOneBy: jest
        .fn()
        .mockImplementation(({ id }) =>
          id === libroExistente.id ? libroExistente : null,
        ),
      preload: jest
        .fn()
        .mockImplementation(({ id, ...cambios }) =>
          id === libroExistente.id ? { ...libroExistente, ...cambios } : null,
        ),
      remove: jest.fn().mockResolvedValue(libroExistente),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: getRepositoryToken(Book),
          useValue: repository,
        },
        {
          provide: getRepositoryToken(Loan),
          useValue: {
            findAndCount: jest.fn().mockResolvedValue([[{}], 1]),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(BooksService);
  });

  describe('findAll', () => {
    it('devuelve la coleccion paginada de libros', async () => {
      const resultado = await service.findAll({});
      expect(resultado.data).toEqual([libroExistente]);
      expect(resultado.meta.total).toBe(1);
      expect(repository.createQueryBuilder).toHaveBeenCalledWith('book');
    });

    it('aplica el filtro de busqueda cuando se envia', async () => {
      await service.findAll({ search: 'clean' });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        { search: '%clean%' },
      );
    });
  });

  describe('findOne', () => {
    it('devuelve el libro cuando existe', async () => {
      const resultado = await service.findOne(1);
      expect(resultado).toEqual(libroExistente);
    });

    it('lanza 404 cuando el libro no existe', async () => {
      repository.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('persiste el libro recibido', async () => {
      const resultado = await service.create({ ...libroExistente });
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(resultado).toBeDefined();
    });

    it('lanza 409 cuando el isbn ya esta registrado', async () => {
      repository.save.mockRejectedValue(errorDeIsbnDuplicado());

      await expect(service.create({ ...libroExistente })).rejects.toThrow(
        ConflictException,
      );
    });

    it('propaga otros errores de base de datos sin convertir', async () => {
      const errorInesperado = new Error('conexion perdida');
      repository.save.mockRejectedValue(errorInesperado);

      await expect(service.create({ ...libroExistente })).rejects.toThrow(
        errorInesperado,
      );
    });
  });

  describe('update', () => {
    it('actualiza el libro existente', async () => {
      const resultado = await service.update(1, { copies: 10 });
      expect(repository.preload).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, copies: 10 }),
      );
      expect(resultado.copies).toBe(10);
    });

    it('lanza 404 cuando el libro a actualizar no existe', async () => {
      await expect(service.update(999, { copies: 10 })).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('lanza 409 cuando el isbn nuevo ya pertenece a otro libro', async () => {
      repository.save.mockRejectedValue(errorDeIsbnDuplicado());

      await expect(
        service.update(1, { isbn: '9780132350885' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('elimina el libro existente', async () => {
      await service.remove(1);
      expect(repository.remove).toHaveBeenCalledWith(libroExistente);
    });

    it('lanza 404 cuando el libro a eliminar no existe', async () => {
      repository.findOneBy.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('lanza 409 cuando el libro tiene prestamos asociados', async () => {
      repository.remove.mockRejectedValue(
        new QueryFailedError('DELETE FROM "books"', [], {
          code: '23503',
          message: 'viola la llave foranea',
        } as never),
      );

      await expect(service.remove(1)).rejects.toThrow(ConflictException);
    });
  });
});
