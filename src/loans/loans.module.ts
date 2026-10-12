import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from '../books/entities/book.entity';
import { User } from '../users/entities/user.entity';
import { Loan } from './entities/loan.entity';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';

@Module({
  imports: [TypeOrmModule.forFeature([Loan, Book, User])],
  controllers: [LoansController],
  providers: [LoansService],
  exports: [LoansService],
})
export class LoansModule {}
