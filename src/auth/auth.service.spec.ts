import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { findByEmailWithPassword: jest.Mock; create: jest.Mock };
  let jwtService: { signAsync: jest.Mock };

  const passwordPlano = 'Secreta123';
  const usuarioConPassword = {
    id: 1,
    name: 'Ana',
    email: 'ana@biblioteca.com',
    password: bcrypt.hashSync(passwordPlano, 10),
    role: 'reader',
  };

  beforeEach(async () => {
    usersService = {
      findByEmailWithPassword: jest.fn(),
      create: jest.fn(),
    };
    jwtService = { signAsync: jest.fn().mockResolvedValue('token.jwt') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('emite un token con credenciales validas', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(usuarioConPassword);

    const resultado = await service.login({
      email: usuarioConPassword.email,
      password: passwordPlano,
    });

    expect(jwtService.signAsync).toHaveBeenCalled();
    expect(resultado.accessToken).toBe('token.jwt');
    expect(resultado.user).not.toHaveProperty('password');
  });

  it('rechaza credenciales invalidas con 401', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(usuarioConPassword);

    await expect(
      service.login({
        email: usuarioConPassword.email,
        password: 'clave incorrecta',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rechaza un usuario inexistente con 401', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(null);

    await expect(
      service.login({ email: 'nadie@x.com', password: 'cualquiera' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
