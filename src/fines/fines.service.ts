import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  construirResultadoPaginado,
  normalizarPaginacion,
  PaginatedResult,
} from '../common/dto/pagination-query.dto';
import { Loan } from '../loans/entities/loan.entity';
import { CreateFineDto } from './dto/create-fine.dto';
import { QueryFinesDto } from './dto/query-fines.dto';
import { UpdateFineDto } from './dto/update-fine.dto';
import { Fine } from './entities/fine.entity';

const CAMPOS_ORDENABLES = ['id', 'amount', 'paid', 'createdAt'];

@Injectable()
export class FinesService {
  constructor(
    @InjectRepository(Fine)
    private readonly fineRepository: Repository<Fine>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  async create(createFineDto: CreateFineDto): Promise<Fine> {
    const prestamo = await this.loanRepository.findOneBy({
      id: createFineDto.loanId,
    });

    if (!prestamo) {
      throw new NotFoundException(
        `No existe un prestamo con el id ${createFineDto.loanId}`,
      );
    }

    const multa = this.fineRepository.create({
      loanId: createFineDto.loanId,
      amount: createFineDto.amount.toFixed(2),
      reason: createFineDto.reason,
      paid: createFineDto.paid ?? false,
    });

    return this.fineRepository.save(multa);
  }

  async findAll(query: QueryFinesDto): Promise<PaginatedResult<Fine>> {
    const { page, limit, skip, order } = normalizarPaginacion(query);
    const solicitado = query.sortBy ?? 'id';
    const sortBy = CAMPOS_ORDENABLES.includes(solicitado) ? solicitado : 'id';

    const qb = this.fineRepository
      .createQueryBuilder('fine')
      .leftJoinAndSelect('fine.loan', 'loan')
      .leftJoinAndSelect('loan.book', 'book')
      .leftJoinAndSelect('loan.user', 'user');

    if (query.loanId) {
      qb.andWhere('fine.loan_id = :loanId', { loanId: query.loanId });
    }

    if (query.paid !== undefined) {
      qb.andWhere('fine.paid = :paid', { paid: query.paid });
    }

    const [data, total] = await qb
      .orderBy(`fine.${sortBy}`, order)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return construirResultadoPaginado(data, total, page, limit);
  }

  async findOne(id: number): Promise<Fine> {
    const multa = await this.fineRepository.findOneBy({ id });

    if (!multa) {
      throw new NotFoundException(`No existe una multa con el id ${id}`);
    }

    return multa;
  }

  async update(id: number, updateFineDto: UpdateFineDto): Promise<Fine> {
    const datos: Partial<Fine> = {
      loanId: updateFineDto.loanId,
      reason: updateFineDto.reason,
      paid: updateFineDto.paid,
    };
    if (updateFineDto.amount !== undefined) {
      datos.amount = updateFineDto.amount.toFixed(2);
    }

    const multa = await this.fineRepository.preload({ id, ...datos });

    if (!multa) {
      throw new NotFoundException(`No existe una multa con el id ${id}`);
    }

    return this.fineRepository.save(multa);
  }

  async remove(id: number): Promise<void> {
    const multa = await this.findOne(id);
    await this.fineRepository.remove(multa);
  }
}
