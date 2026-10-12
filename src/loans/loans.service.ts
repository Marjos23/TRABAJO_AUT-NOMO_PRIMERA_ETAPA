import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  construirResultadoPaginado,
  normalizarPaginacion,
  PaginatedResult,
} from '../common/dto/pagination-query.dto';
import { Book } from '../books/entities/book.entity';
import { User } from '../users/entities/user.entity';
import { CreateLoanDto } from './dto/create-loan.dto';
import { QueryLoansDto } from './dto/query-loans.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { Loan, LoanStatus } from './entities/loan.entity';

const DIAS_PRESTAMO_POR_DEFECTO = 14;
const CAMPOS_ORDENABLES = ['id', 'loanDate', 'dueDate', 'returnDate', 'status'];

@Injectable()
export class LoansService {
  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createLoanDto: CreateLoanDto): Promise<Loan> {
    const libro = await this.bookRepository.findOneBy({
      id: createLoanDto.bookId,
    });

    if (!libro) {
      throw new NotFoundException(
        `No existe un libro con el id ${createLoanDto.bookId}`,
      );
    }

    const usuario = await this.userRepository.findOneBy({
      id: createLoanDto.userId,
    });

    if (!usuario) {
      throw new NotFoundException(
        `No existe un usuario con el id ${createLoanDto.userId}`,
      );
    }

    const loanDate = createLoanDto.loanDate
      ? new Date(createLoanDto.loanDate)
      : new Date();

    const dueDate = createLoanDto.dueDate
      ? new Date(createLoanDto.dueDate)
      : new Date(loanDate.getTime() + DIAS_PRESTAMO_POR_DEFECTO * 86400000);

    if (dueDate.getTime() <= loanDate.getTime()) {
      throw new BadRequestException(
        'La fecha de vencimiento debe ser posterior a la fecha de prestamo',
      );
    }

    const prestamo = this.loanRepository.create({
      bookId: createLoanDto.bookId,
      userId: createLoanDto.userId,
      loanDate,
      dueDate,
      status: createLoanDto.status ?? LoanStatus.ACTIVE,
    });

    const guardado = await this.loanRepository.save(prestamo);
    return this.findOne(guardado.id);
  }

  async findAll(query: QueryLoansDto): Promise<PaginatedResult<Loan>> {
    const { page, limit, skip, order } = normalizarPaginacion(query);
    const solicitado = query.sortBy ?? 'id';
    const sortBy = CAMPOS_ORDENABLES.includes(solicitado) ? solicitado : 'id';

    const qb = this.loanRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.book', 'book')
      .leftJoinAndSelect('loan.user', 'user');

    if (query.status) {
      qb.andWhere('loan.status = :status', { status: query.status });
    }

    if (query.userId) {
      qb.andWhere('loan.user_id = :userId', { userId: query.userId });
    }

    if (query.bookId) {
      qb.andWhere('loan.book_id = :bookId', { bookId: query.bookId });
    }

    const [data, total] = await qb
      .orderBy(`loan.${sortBy}`, order)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return construirResultadoPaginado(data, total, page, limit);
  }

  async findOne(id: number): Promise<Loan> {
    const prestamo = await this.loanRepository.findOneBy({ id });

    if (!prestamo) {
      throw new NotFoundException(`No existe un prestamo con el id ${id}`);
    }

    return prestamo;
  }

  async update(id: number, updateLoanDto: UpdateLoanDto): Promise<Loan> {
    const datos: Partial<Loan> = {};

    if (updateLoanDto.bookId !== undefined) {
      datos.bookId = updateLoanDto.bookId;
    }
    if (updateLoanDto.userId !== undefined) {
      datos.userId = updateLoanDto.userId;
    }
    if (updateLoanDto.loanDate !== undefined) {
      datos.loanDate = new Date(updateLoanDto.loanDate);
    }
    if (updateLoanDto.dueDate !== undefined) {
      datos.dueDate = new Date(updateLoanDto.dueDate);
    }
    if (updateLoanDto.returnDate !== undefined) {
      datos.returnDate = new Date(updateLoanDto.returnDate);
    }
    if (updateLoanDto.status !== undefined) {
      datos.status = updateLoanDto.status;
    }

    const prestamo = await this.loanRepository.preload({ id, ...datos });

    if (!prestamo) {
      throw new NotFoundException(`No existe un prestamo con el id ${id}`);
    }

    await this.loanRepository.save(prestamo);
    return this.findOne(id);
  }

  async returnBook(id: number): Promise<Loan> {
    const prestamo = await this.findOne(id);

    if (prestamo.status === LoanStatus.RETURNED) {
      throw new BadRequestException('El prestamo ya fue devuelto');
    }

    prestamo.returnDate = new Date();
    prestamo.status = LoanStatus.RETURNED;

    await this.loanRepository.save(prestamo);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const prestamo = await this.findOne(id);
    await this.loanRepository.remove(prestamo);
  }
}
