import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { FinesModule } from './fines/fines.module';
import { LoansModule } from './loans/loans.module';
import { UsersModule } from './users/users.module';
import { construirOpcionesTypeOrm } from './database/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: construirOpcionesTypeOrm,
    }),
    UsersModule,
    AuthModule,
    BooksModule,
    LoansModule,
    FinesModule,
  ],
})
export class AppModule {}
