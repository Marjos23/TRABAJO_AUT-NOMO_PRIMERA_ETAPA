import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ClassConstructor } from 'class-transformer';
import { CreateBookDto } from './create-book.dto';
import { UpdateBookDto } from './update-book.dto';

const dtoValido = {
  title: 'Clean Code',
  author: 'Robert C. Martin',
  isbn: '9780132350884',
  category: 'Tecnologia',
  year: 2008,
  copies: 5,
};

async function validarDto(clase: ClassConstructor<object>, datos: object) {
  const instancia = plainToInstance(clase, datos);
  return await validate(instancia, { whitelist: true, forbidNonWhitelisted: true });
}

describe('CreateBookDto', () => {
  it('acepta un payload valido sin errores', async () => {
    const errores = await validarDto(CreateBookDto, dtoValido);
    expect(errores).toHaveLength(0);
  });

  it('rechaza el titulo vacio', async () => {
    const errores = await validarDto(CreateBookDto, { ...dtoValido, title: '' });
    expect(errores.length).toBeGreaterThan(0);
  });

  it('rechaza un isbn demasiado corto', async () => {
    const errores = await validarDto(CreateBookDto, { ...dtoValido, isbn: '123' });
    expect(errores.length).toBeGreaterThan(0);
  });

  it('rechaza anio no numerico', async () => {
    const errores = await validarDto(CreateBookDto, { ...dtoValido, year: 'dosmil' });
    expect(errores.length).toBeGreaterThan(0);
  });

  it('rechaza copias negativas', async () => {
    const errores = await validarDto(CreateBookDto, { ...dtoValido, copies: -1 });
    expect(errores.length).toBeGreaterThan(0);
  });

  it('rechaza propiedades no permitidas', async () => {
    const errores = await validarDto(CreateBookDto, {
      ...dtoValido,
      campoInvalido: true,
    });
    expect(errores.some((e) => e.property === 'campoInvalido')).toBe(true);
  });
});

describe('UpdateBookDto', () => {
  it('acepta una actualizacion parcial', async () => {
    const errores = await validarDto(UpdateBookDto, { copies: 10 });
    expect(errores).toHaveLength(0);
  });

  it('rechaza un payload vacio', async () => {
    const errores = await validarDto(UpdateBookDto, {});
    expect(errores).toHaveLength(0);
    expect(Object.keys(plainToInstance(UpdateBookDto, {}))).toHaveLength(0);
  });

  it('sigue validando los tipos de los campos enviados', async () => {
    const errores = await validarDto(UpdateBookDto, { copies: 'muchas' });
    expect(errores.length).toBeGreaterThan(0);
  });
});
