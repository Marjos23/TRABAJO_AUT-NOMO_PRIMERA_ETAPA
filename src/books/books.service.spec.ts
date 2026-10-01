import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
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
};

describe('BooksService', () => {
  let service: BooksService;
  let repository: Record<string, jest.Mock>;

  beforeEach(async () => {
    repository = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto })),
      save: jest.fn().mockImplementation((libro) => libro),
      find: jest.fn().mockResolvedValue([libroExistente]),
      findOneBy: jest.fn().mockResolvedValue(libroExistente),
      preload: jest
        .fn()
        .mockImplementation(({ id, ...cambios }) => ({
          ...libroExistente,
          ...cambios,
        })),
      remove: jest.fn().mockResolvedValue(libroExistente),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: getRepositoryToken(Book),
          useValue: repository,
        },
      ],
    }).compile();

    service = moduleRef.get(BooksService);
  });

  describe('findAll', () => {
    it('devuelve la coleccion de libros', async () => {
      const resultado = await service.findAll();
      expect(resultado).toEqual([libroExistente]);
      expect(repository.find).toHaveBeenCalled();
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
      repository.preload.mockResolvedValue(null);
      await expect(service.update(999, { copies: 10 })).rejects.toThrow(
        NotFoundException,
      );
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
  });
});
