import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import {
  construirResultadoPaginado,
  normalizarPaginacion,
  PaginatedResult,
} from '../common/dto/pagination-query.dto';
import { Loan } from '../loans/entities/loan.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { QueryBooksDto } from './dto/query-books.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book } from './entities/book.entity';

const CODIGO_ISBN_UNICO = '23505';
const CODIGOS_CLAVE_FORANEA = ['23503', '23001'];
const CAMPOS_ORDENABLES = [
  'id',
  'title',
  'author',
  'category',
  'year',
  'copies',
];

function esViolacionDeIsbnUnico(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }

  const driverError = error.driverError as { code?: string };

  return driverError?.code === CODIGO_ISBN_UNICO;
}

function esViolacionDeClaveForanea(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }

  const driverError = error.driverError as { code?: string };

  return CODIGOS_CLAVE_FORANEA.includes(driverError?.code ?? '');
}

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  async create(createBookDto: CreateBookDto): Promise<Book> {
    const libro = this.bookRepository.create(createBookDto);

    try {
      return await this.bookRepository.save(libro);
    } catch (error) {
      if (esViolacionDeIsbnUnico(error)) {
        throw new ConflictException(
          `Ya existe un libro registrado con el isbn ${createBookDto.isbn}`,
        );
      }
      throw error;
    }
  }

  async findAll(query: QueryBooksDto): Promise<PaginatedResult<Book>> {
    const { page, limit, skip, order } = normalizarPaginacion(query);
    const solicitado = query.sortBy ?? 'id';
    const sortBy = CAMPOS_ORDENABLES.includes(solicitado) ? solicitado : 'id';

    const qb = this.bookRepository.createQueryBuilder('book');

    if (query.search) {
      qb.andWhere(
        '(book.title ILIKE :search OR book.author ILIKE :search OR book.isbn ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.category) {
      qb.andWhere('book.category = :category', { category: query.category });
    }

    if (query.year !== undefined) {
      qb.andWhere('book.year = :year', { year: query.year });
    }

    if (query.minCopies !== undefined) {
      qb.andWhere('book.copies >= :minCopies', { minCopies: query.minCopies });
    }

    const [data, total] = await qb
      .orderBy(`book.${sortBy}`, order)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return construirResultadoPaginado(data, total, page, limit);
  }

  async findOne(id: number): Promise<Book> {
    const libro = await this.bookRepository.findOneBy({ id });

    if (!libro) {
      throw new NotFoundException(`No existe un libro con el id ${id}`);
    }

    return libro;
  }

  async update(id: number, updateBookDto: UpdateBookDto): Promise<Book> {
    const libro = await this.bookRepository.preload({ id, ...updateBookDto });

    if (!libro) {
      throw new NotFoundException(`No existe un libro con el id ${id}`);
    }

    try {
      return await this.bookRepository.save(libro);
    } catch (error) {
      if (esViolacionDeIsbnUnico(error)) {
        throw new ConflictException(
          `Ya existe otro libro registrado con el isbn ${updateBookDto.isbn}`,
        );
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const libro = await this.findOne(id);

    try {
      await this.bookRepository.remove(libro);
    } catch (error) {
      if (esViolacionDeClaveForanea(error)) {
        throw new ConflictException(
          `No se puede eliminar el libro ${id} porque tiene prestamos asociados`,
        );
      }
      throw error;
    }
  }

  async findLoans(
    bookId: number,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Loan>> {
    await this.findOne(bookId);

    const [data, total] = await this.loanRepository.findAndCount({
      where: { bookId },
      order: { loanDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return construirResultadoPaginado(data, total, page, limit);
  }
}
