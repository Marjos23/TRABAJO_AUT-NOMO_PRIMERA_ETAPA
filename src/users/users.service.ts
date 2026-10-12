import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { QueryFailedError, Repository } from 'typeorm';
import {
  construirResultadoPaginado,
  normalizarPaginacion,
  PaginatedResult,
} from '../common/dto/pagination-query.dto';
import { Loan } from '../loans/entities/loan.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

const CODIGO_EMAIL_UNICO = '23505';
const SALT_ROUNDS = 10;
const CAMPOS_ORDENABLES = ['id', 'name', 'email', 'role', 'createdAt'];

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const usuario = this.userRepository.create({
      ...createUserDto,
      password: await bcrypt.hash(createUserDto.password, SALT_ROUNDS),
    });

    try {
      const guardado = await this.userRepository.save(usuario);
      return this.sinPassword(guardado);
    } catch (error) {
      if (this.esEmailDuplicado(error)) {
        throw new ConflictException(
          `Ya existe un usuario registrado con el email ${createUserDto.email}`,
        );
      }
      throw error;
    }
  }

  async findAll(query: QueryUsersDto): Promise<PaginatedResult<User>> {
    const { page, limit, skip, order } = normalizarPaginacion(query);
    const solicitado = query.sortBy ?? 'id';
    const sortBy = CAMPOS_ORDENABLES.includes(solicitado) ? solicitado : 'id';

    const qb = this.userRepository.createQueryBuilder('user');

    if (query.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }

    if (query.search) {
      qb.andWhere('(user.name ILIKE :search OR user.email ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const [data, total] = await qb
      .orderBy(`user.${sortBy}`, order)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return construirResultadoPaginado(data, total, page, limit);
  }

  async findOne(id: number): Promise<User> {
    const usuario = await this.userRepository.findOneBy({ id });

    if (!usuario) {
      throw new NotFoundException(`No existe un usuario con el id ${id}`);
    }

    return usuario;
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const datos: Partial<User> = { ...updateUserDto };

    if (updateUserDto.password) {
      datos.password = await bcrypt.hash(updateUserDto.password, SALT_ROUNDS);
    }

    const usuario = await this.userRepository.preload({ id, ...datos });

    if (!usuario) {
      throw new NotFoundException(`No existe un usuario con el id ${id}`);
    }

    try {
      const guardado = await this.userRepository.save(usuario);
      return this.sinPassword(guardado);
    } catch (error) {
      if (this.esEmailDuplicado(error)) {
        throw new ConflictException(
          `Ya existe otro usuario registrado con el email ${updateUserDto.email}`,
        );
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const usuario = await this.findOne(id);
    await this.userRepository.remove(usuario);
  }

  async findLoans(
    userId: number,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Loan>> {
    await this.findOne(userId);

    const [data, total] = await this.loanRepository.findAndCount({
      where: { userId },
      order: { loanDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return construirResultadoPaginado(data, total, page, limit);
  }

  private sinPassword(usuario: User): User {
    const { password, ...resto } = usuario;
    void password;
    return resto as User;
  }

  private esEmailDuplicado(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }
    const driverError = error.driverError as { code?: string };
    return driverError?.code === CODIGO_EMAIL_UNICO;
  }
}
