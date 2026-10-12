import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

export interface AuthenticatedUser {
  userId: number;
  email: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<{
      user: AuthenticatedUser;
    }>();
    return request.user;
  },
);
