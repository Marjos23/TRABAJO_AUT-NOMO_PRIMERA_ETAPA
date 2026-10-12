import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../users/entities/user.entity';

export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'cambiar_esto',
    });
  }

  async validate(payload: JwtPayload) {
    try {
      const usuario = await this.usersService.findOne(payload.sub);
      return { userId: usuario.id, email: usuario.email, role: usuario.role };
    } catch {
      throw new UnauthorizedException('El usuario del token ya no existe');
    }
  }
}
