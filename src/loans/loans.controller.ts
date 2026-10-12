import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateLoanDto } from './dto/create-loan.dto';
import { QueryLoansDto } from './dto/query-loans.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { Loan } from './entities/loan.entity';
import { LoansService } from './loans.service';

@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createLoanDto: CreateLoanDto): Promise<Loan> {
    return this.loansService.create(createLoanDto);
  }

  @Get()
  findAll(@Query() query: QueryLoansDto) {
    return this.loansService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Loan> {
    return this.loansService.findOne(id);
  }

  @Post(':id/return')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  returnBook(@Param('id', ParseIntPipe) id: number): Promise<Loan> {
    return this.loansService.returnBook(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLoanDto: UpdateLoanDto,
  ): Promise<Loan> {
    return this.loansService.update(id, updateLoanDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.loansService.remove(id);
  }
}
