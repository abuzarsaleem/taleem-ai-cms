import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { databaseEntities } from './entities';

const sslEnabled = process.env.DB_SSL === 'true';

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'postgres',
  entities: databaseEntities,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
};

export default new DataSource(typeOrmConfig);
