import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ENTIDADES } from './typeorm.config';

function aNumero(valor: string | undefined, porDefecto: number): number {
  const parseado = Number(valor);
  return Number.isInteger(parseado) && parseado > 0 ? parseado : porDefecto;
}

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: aNumero(process.env.DB_PORT, 5432),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'biblioteca_db',
  entities: ENTIDADES,
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
