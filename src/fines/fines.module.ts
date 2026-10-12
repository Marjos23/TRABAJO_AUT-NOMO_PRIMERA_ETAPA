import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Loan } from '../loans/entities/loan.entity';
import { Fine } from './entities/fine.entity';
import { FinesController } from './fines.controller';
import { FinesService } from './fines.service';

@Module({
  imports: [TypeOrmModule.forFeature([Fine, Loan])],
  controllers: [FinesController],
  providers: [FinesService],
})
export class FinesModule {}
