import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    return this.usersService.create(registerDto);
  }

  async login(loginDto: LoginDto): Promise<TokenResponse> {
    const usuario = await this.usersService.findByEmailWithPassword(
      loginDto.email,
    );

    if (!usuario || !usuario.password) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const coincide = await bcrypt.compare(loginDto.password, usuario.password);

    if (!coincide) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
      user: {
        id: usuario.id,
        name: usuario.name,
        email: usuario.email,
        role: usuario.role,
      },
    };
  }
}
