# TRABAJO_AUTONOMO_PRIMERA_ETAPA

API REST de gestión de biblioteca desarrollada con NestJS, PostgreSQL y TypeORM.

**Etapa:** 1 — Fundamentos y definición de la API
**Asignatura:** Desarrollo Backend Web con NestJS
**Docente:** Edgardo Panchana Flores

---

## 1. Definición del proyecto

### Problema

Las bibliotecas pequeñas y medianAS no cuentan con un sistema centralizado para llevar
el control de su inventario de libros. Como consecuencia, no se puede saber con
precisión cuántos ejemplares existen de cada título, qué categorías están disponibles
ni cuál es la disponibilidad real para el préstamo.

### Usuarios previstos

| Usuario | Descripción | Etapa |
|---|---|---|
| Bibliotecario | Administra el catálogo de libros (alta, edición, baja) | 1 |
| Lector | Consulta el catálogo y solicita préstamos | 2 (prevista) |

El modelo crece de forma natural hacia **Préstamos**, **Multas** y **Usuarios** en las
etapas siguientes, sin necesidad de reescribir el recurso ya implementado.

### Recurso principal

`Book` (Libro) — es el recurso que administra la API en esta primera etapa.

| Campo | Tipo | Restricción |
|---|---|---|
| id | number | PK, autogenerado |
| title | string | 1–200 caracteres |
| author | string | 1–150 caracteres |
| isbn | string | 10–20 caracteres, único |
| category | string | 1–100 caracteres |
| year | number | entero positivo |
| copies | number | entero, mínimo 0 |

### Diagrama inicial de entidades

```
+-------------------+
|      books        |
+-------------------+
| id       PK  int  |
| title       varchar(200) |
| author      varchar(150) |
| isbn    UQ  varchar(20)  |
| category     varchar(100) |
| year         int    |
| copies        int    |
+-------------------+

[ books ] 1 ----< N [ loans ]  (previsto, etapa 2)
[ users ] 1 ----< N [ loans ]  (previsto, etapa 2)
```

Para esta etapa el modelo se materializa únicamente en `books`. Las tablas `loans`
y `users` seCtienen en el diagrama para evidenciar la evolución semestral prevista.

---

## 2. Arquitectura NestJS

La solución está organizada en módulos de negocio. Cada recurso tiene su propio
módulo, controlador y servicio:

```
src/
├── app.module.ts          # ConfigModule + TypeOrmModule + BooksModule
├── main.ts                # ValidationPipe global (whitelist + forbidNonWhitelisted)
└── books/
    ├── books.module.ts    # Registra controlador, servicio y repositorio
    ├── books.controller.ts# Rutas REST; delega toda la lógica al servicio
    ├── books.service.ts   # Reglas de negocio, acceso a datos y errores
    ├── dto/
    │   ├── create-book.dto.ts
    │   └── update-book.dto.ts
    └── entities/
        └── book.entity.ts # Entidad TypeORM
```

**Principio aplicado:** el controlador solo traduce HTTP → servicio. El servicio es
el único lugar donde se decide si una operación es válida o debe fallar, y es el
único que accede al repositorio. La inyección de dependencias se usa en ambos
sentidos: el controlador recibe el servicio por constructor, y el servicio recibe
`Repository<Book>` mediante `@InjectRepository`.

---

## 3. Endpoints

| Método | Ruta            | Descripción                    | Éxito |
|--------|-----------------|--------------------------------|--------|
| GET    | `/books`        | Listar todos los libros        | 200    |
| GET    | `/books/:id`    | Obtener un libro por ID        | 200    |
| POST   | `/books`        | Crear un libro                 | 201    |
| PATCH  | `/books/:id`    | Actualizar un libro (parcial)  | 200    |
| DELETE | `/books/:id`    | Eliminar un libro              | 204    |

### Códigos de error

| Código | Cuándo se produce |
|--------|-------------------|
| 400 | Payload que no cumple los DTOs, propiedad no permitida, `id` no numérico |
| 404 | El libro solicitado no existe |
| 201 | Libro creado correctamente |
| 204 | Libro eliminado correctamente |

---

## 4. Tecnologías

- [NestJS](https://nestjs.com/)
- [TypeORM](https://typeorm.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [class-validator](https://github.com/typestack/class-validator)
- [class-transformer](https://github.com/typestack/class-transformer)
- Git / GitHub

---

## 5. Requisitos previos

- Node.js 18 o superior
- npm
- PostgreSQL instalado y en ejecución
- Git

## 6. Instalación

```bash
git clone https://github.com/Marjos23/TRABAJO_AUTONOMO_PRIMERA_ETAPA.git
cd TRABAJO_AUTONOMO_PRIMERA_ETAPA
npm install
```

## 7. Configuración

La configuración se lee exclusivamente desde variables de entorno.

1. Crear la base de datos:

```sql
CREATE DATABASE biblioteca_db;
```

2. Copiar el archivo de ejemplo y completar los valores:

```bash
cp .env.example .env
```

Contenido esperado de `.env`:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=biblioteca_db
```

`.env` está en `.gitignore` y **no se versiona**. Solo se publica `.env.example`.

## 8. Ejecución

```bash
# Desarrollo (recarga automática)
npm run start:dev

# Compilar y ejecutar
npm run build
npm run start:prod
```

La API queda disponible en `http://localhost:3000`.

> En desarrollo la entidad se crea automáticamente porque TypeORM corre con
> `synchronize: true`. Para producción deben usarse migraciones.

## 9. Pruebas con curl

Crear un libro:

```bash
curl -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Clean Code","author":"Robert C. Martin","isbn":"9780132350884","category":"Tecnología","year":2008,"copies":5}'
```

Listar libros:

```bash
curl http://localhost:3000/books
```

Obtener un libro por ID:

```bash
curl http://localhost:3000/books/1
```

Actualizar parcialmente:

```bash
curl -X PATCH http://localhost:3000/books/1 \
  -H "Content-Type: application/json" \
  -d '{"copies":10}'
```

Eliminar:

```bash
curl -X DELETE http://localhost:3000/books/1
```

Validar el error 400 (propiedad no permitida):

```bash
curl -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -d '{"title":"X","author":"Y","isbn":"123","category":"Z","year":2020,"copies":1,"campoInvalido":true}'
```

Validar el error 404:

```bash
curl http://localhost:3000/books/9999
```

## 10. Integrantes

1. Nombre y Apellido
2. Nombre y Apellido
3. Nombre y Apellido
4. Nombre y Apellido

## 11. Evidencias

Las capturas de las pruebas manuales (CRUD completo, respuesta 400, respuesta 404 y
persistencia de datos tras reiniciar la API) se adjuntan en el documento Word de la
entrega.
