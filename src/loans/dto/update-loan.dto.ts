import { PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsOptional } from 'class-validator';
import { CreateLoanDto } from './create-loan.dto';

export class UpdateLoanDto extends PartialType(CreateLoanDto) {
  @IsOptional()
  @IsDateString({}, { message: 'returnDate debe ser una fecha ISO 8601' })
  returnDate?: string;
}
