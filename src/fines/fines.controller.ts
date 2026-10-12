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
import { CreateFineDto } from './dto/create-fine.dto';
import { QueryFinesDto } from './dto/query-fines.dto';
import { UpdateFineDto } from './dto/update-fine.dto';
import { Fine } from './entities/fine.entity';
import { FinesService } from './fines.service';

@Controller('fines')
export class FinesController {
  constructor(private readonly finesService: FinesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createFineDto: CreateFineDto): Promise<Fine> {
    return this.finesService.create(createFineDto);
  }

  @Get()
  findAll(@Query() query: QueryFinesDto) {
    return this.finesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Fine> {
    return this.finesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFineDto: UpdateFineDto,
  ): Promise<Fine> {
    return this.finesService.update(id, updateFineDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.finesService.remove(id);
  }
}
