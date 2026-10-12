import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Book } from '../books/entities/book.entity';
import { User } from '../users/entities/user.entity';
import { Loan } from '../loans/entities/loan.entity';
import { Fine } from '../fines/entities/fine.entity';

export const ENTIDADES = [Book, User, Loan, Fine];

function aNumero(valor: string | undefined, porDefecto: number): number {
  const parseado = Number(valor);
  return Number.isInteger(parseado) && parseado > 0 ? parseado : porDefecto;
}

export function construirOpcionesTypeOrm(
  configService: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: aNumero(configService.get<string>('DB_PORT'), 5432),
    username: configService.get<string>('DB_USER'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    entities: ENTIDADES,
    migrations: ['dist/database/migrations/*.js'],
    synchronize: false,
  };
}
