import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UserRole } from '../entities/user.entity';

export class QueryUsersDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'role debe ser librarian o reader' })
  role?: UserRole;
}
