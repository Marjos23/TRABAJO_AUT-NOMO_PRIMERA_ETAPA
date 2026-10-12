# TRABAJO AUTÓNOMO — SEGUNDA ETAPA

API REST de gestión de biblioteca desarrollada con NestJS, PostgreSQL y TypeORM.

**Etapa:** 2 — Modelo relacional y autenticación
**Asignatura:** Desarrollo Backend Web con NestJS
**Docente:** Edgardo Panchana Flores
**Nivel:** 7 — Semana 7

---

## 1. Continuidad con la Etapa 1

Esta etapa **evoluciona** el mismo proyecto de la Etapa 1. El recurso principal
`Book` conserva sus campos, sus DTOs de escritura y sus códigos de respuesta. La
API de libros sigue funcionando; lo único que cambia es:

- `GET /books` ahora es **paginado, filtrable y ordenable** y devuelve
  `{ data, meta }` en lugar de un arreglo plano (cambio documentado en la
  sección 4).
- Los endpoints de **escritura** de libros quedan protegidos con JWT (sección 6).

No se reinició ni sustituyó nada de la etapa anterior.

---

## 2. Modelo relacional

Además del `Book` existente y de `User`, se agregaron dos entidades de dominio:
`Loan` (préstamo) y `Fine` (multa).

### Entidades y campos

| Entidad | Tabla | Campos relevantes |
|---|---|---|
| `Book` | `books` | id, title, author, isbn (UQ), category, year, copies |
| `User` | `users` | id, name, email (UQ), password (hash, `select: false`), role, createdAt, updatedAt |
| `Loan` | `loans` | id, **book_id FK**, **user_id FK**, loanDate, dueDate, returnDate, status |
| `Fine` | `fines` | id, **loan_id FK**, amount, reason, paid, createdAt |

### Relaciones e integridad referencial

| Relación | Tipo | Regla de borrado | Justificación |
|---|---|---|---|
| `User` → `Loan` | OneToMany / ManyToOne | `ON DELETE CASCADE` | Si se elimina un usuario, sus préstamos dejan de tener sentido. |
| `Book` → `Loan` | OneToMany / ManyToOne | `ON DELETE RESTRICT` | No se debe borrar un libro con historial de préstamos; la API responde `409`. |
| `Loan` → `Fine` | OneToMany / ManyToOne | `ON DELETE CASCADE` | Una multa no existe sin el préstamo que la origina. |

Los datos relacionados **no se duplican**: un préstamo guarda `book_id` y
`user_id`, no el título ni el correo. Del mismo modo, una multa guarda `loan_id`.

### Diagrama relacional

```
+------------------+          +-------------------+          +------------------+
|      users       |          |       loans       |          |      books       |
+------------------+          +-------------------+          +------------------+
| id       PK      |1        N| id       PK       |N        1| id       PK      |
| name             |----------| user_id  FK       |----------| title            |
| email    UQ      |          | book_id  FK       |          | author           |
| password (hash)  |          | loan_date         |          | isbn     UQ      |
| role             |          | due_date          |          | category         |
| created_at       |          | return_date (null)|          | year             |
| updated_at       |          | status            |          | copies           |
+------------------+          | created_at        |          +------------------+
                              | updated_at        |
                              +-------------------+
                                       |1
                                       |
                                       |N
                              +-------------------+
                              |       fines       |
                              +-------------------+
                              | id       PK       |
                              | loan_id  FK       |
                              | amount   numeric  |
                              | reason            |
                              | paid              |
                              | created_at        |
                              +-------------------+
```

- `users.id 1 ──< N loans.user_id`  (CASCADE)
- `books.id 1 ──< N loans.book_id`  (RESTRICT)
- `loans.id 1 ──< N fines.loan_id`  (CASCADE)

El esquema se crea con una **migración versionada** (sección 5). No se usa
`synchronize`.

---

## 3. Arquitectura NestJS

```
src/
├── app.module.ts                 # ConfigModule + TypeORM + módulos de negocio
├── main.ts                       # ValidationPipe global (whitelist, transform)
├── common/dto/
│   └── pagination-query.dto.ts   # page, limit, sortBy, order + metadatos
├── database/
│   ├── data-source.ts            # DataSource para el CLI de TypeORM
│   ├── typeorm.config.ts         # Opciones compartidas (entidades, migrate)
│   └── migrations/
│       └── 1791774691127-InitialSchema.ts
├── auth/
│   ├── auth.module.ts / auth.service.ts / auth.controller.ts
│   ├── dto/{register,login}.dto.ts
│   ├── guards/jwt-auth.guard.ts
│   ├── strategies/jwt.strategy.ts
│   └── decorators/current-user.decorator.ts
├── users/  (entidad, DTOs, servicio, controlador)
├── books/  (Etapa 1 + paginación + relación con loans)
├── loans/  (nuevo recurso relacionado)
└── fines/  (nuevo recurso relacionado)
```

**Principio aplicado:** el controlador traduce HTTP → servicio; el servicio
concentra reglas de negocio, validaciones y acceso a repositorios.

---

## 4. Endpoints

### Públicos

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register` | Registrar usuario (contraseña cifrada) |
| POST | `/auth/login` | Iniciar sesión y obtener JWT |
| GET | `/books` | Listar libros (paginado, filtrable, ordenable) |
| GET | `/books/:id` | Obtener libro |
| GET | `/books/:id/loans` | Préstamos de un libro (datos relacionados) |
| GET | `/loans` | Listar préstamos (paginado, filtrable, ordenable) |
| GET | `/loans/:id` | Obtener préstamo |
| GET | `/fines` | Listar multas (paginado, filtrable, ordenable) |
| GET | `/fines/:id` | Obtener multa |

### Protegidos (requieren `Authorization: Bearer <token>`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/auth/me` | Datos del usuario autenticado |
| POST | `/books` | Crear libro |
| PATCH | `/books/:id` | Actualizar libro |
| DELETE | `/books/:id` | Eliminar libro |
| POST | `/loans` | Crear préstamo (asocia book + user) |
| PATCH | `/loans/:id` | Actualizar préstamo |
| DELETE | `/loans/:id` | Eliminar préstamo |
| POST | `/loans/:id/return` | Registrar devolución |
| POST | `/fines` | Crear multa |
| PATCH | `/fines/:id` | Actualizar multa |
| DELETE | `/fines/:id` | Eliminar multa |
| POST | `/users` | Crear usuario |
| GET | `/users` | Listar usuarios |
| GET | `/users/:id` | Obtener usuario |
| GET | `/users/:id/loans` | Préstamos de un usuario (datos relacionados) |
| PATCH | `/users/:id` | Actualizar usuario |
| DELETE | `/users/:id` | Eliminar usuario |

### Códigos de error

| Código | Cuándo se produce |
|---|---|
| 400 | Payload/query inválido, propiedad no permitida, fecha inválida |
| 401 | Endpoint protegido sin token o con token inválido/expirado; login incorrecto |
| 404 | El recurso solicitado no existe |
| 409 | ISBN o email duplicado; borrar un libro con préstamos asociados |

---

## 5. Consultas: filtros, ordenamiento y paginación

Todas las colecciones aceptan los mismos parámetros base:

| Param | Descripción | Default |
|---|---|---|
| `page` | Número de página (≥ 1) | 1 |
| `limit` | Resultados por página (1–100) | 10 |
| `sortBy` | Campo de ordenamiento (lista blanca por recurso) | `id` |
| `order` | `ASC` o `DESC` | `ASC` |

Cada recurso agrega sus propios filtros:

- `GET /books?search=&category=&year=&minCopies=`
  - `search` busca en `title`, `author` e `isbn` (ILIKE).
- `GET /loans?status=&userId=&bookId=`
- `GET /fines?loanId=&paid=`
- `GET /users?search=&role=`

La respuesta siempre incluye metadatos:

```json
{
  "data": [ { "id": 1, "title": "Clean Code" } ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

Ejemplo:

```bash
curl "http://localhost:3000/books?search=clean&sortBy=year&order=DESC&page=1&limit=5"
```

---

## 6. Autenticación JWT y rutas protegidas

- Las contraseñas se cifran con **bcrypt** (10 rondas) y la columna se declara
  `select: false`: nunca se guarda ni se devuelve en texto plano.
- El login valida credenciales y emite un **JWT** firmado con `JWT_SECRET`.
- `JwtAuthGuard` protege los endpoints de escritura. Sin token o con token
  inválido la respuesta es `401`; con token válido la operación continúa.

Registro:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana Librera","email":"ana@biblioteca.com","password":"Secreta123"}'
```

Login:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@biblioteca.com","password":"Secreta123"}'
# -> { "accessToken": "...", "tokenType": "Bearer", "user": { ... } }
```

Petición sin token (401) y con token (201):

```bash
# Sin token
curl -i -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Clean Code","author":"Robert C. Martin","isbn":"9780132350884","category":"Tecnologia","year":2008,"copies":5}'
# HTTP/1.1 401 Unauthorized

# Con token
TOKEN="<accessToken>"
curl -i -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Clean Code","author":"Robert C. Martin","isbn":"9780132350884","category":"Tecnologia","year":2008,"copies":5}'
# HTTP/1.1 201 Created
```

### Credenciales de prueba (no sensibles)

| Email | Contraseña | Rol |
|---|---|---|
| `ana@biblioteca.com` | `Secreta123` | reader |

---

## 7. Migraciones y configuración

El esquema se administra con migraciones versionadas. `synchronize` está fijo en
`false`.

```bash
# Aplicar la migración inicial
npm run migration:run

# Ver el estado de las migraciones
npm run migration:show

# Revertir la última migración
npm run migration:revert

# Generar una nueva migración a partir de cambios en las entidades
npm run migration:generate -- src/database/migrations/NombreCambio
```

### Variables de entorno

Copiar `.env.example` a `.env` y completar:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=biblioteca_db
DB_SYNCHRONIZE=0
JWT_SECRET=cambia_esta_clave_por_una_larga_y_aleatoria
JWT_EXPIRES_IN=1h
```

`.env` está en `.gitignore` y **no se versiona**; solo se publica `.env.example`.

---

## 8. Instalación y ejecución

```bash
git clone <URL_DEL_REPOSITORIO>
cd TRABAJO_AUTONOMO_SEGUNDA_ETAPA
npm install
cp .env.example .env      # completar credenciales
npm run migration:run
npm run start:dev
```

La API queda en `http://localhost:3000`.

### Pruebas

```bash
npm test           # 30 pruebas unitarias (DTOs, servicios, auth, paginación)
npm run lint       # ESLint con corrección automática
npm run lint:check # ESLint sin escribir archivos
npm run build      # verificación de compilación
```

Las pruebas unitarias no requieren base de datos: los repositorios se simulan.
Cubren validación de DTOs, CRUD de libros, conflicto por ISBN, conflicto por
clave foránea, autenticación (login válido/inválido) y utilidades de paginación.

---

## 9. Pruebas con Postman

La carpeta `postman/` incluye la colección `biblioteca-api-etapa2.postman_collection.json`
con los flujos de registro, login (guarda el token automáticamente), CRUD
protegido, préstamos, multas, filtros y paginación.

```bash
npx newman run postman/biblioteca-api-etapa2.postman_collection.json
```

Requiere la API y la base de datos levantadas.

---

## 10. Evidencias

En el documento Word de la entrega se adjuntan:

- Diagrama relacional actualizado.
- Tabla de endpoints protegidos y prueba autorizado vs no autorizado (`401`).
- Evidencia de registro con contraseña cifrada, login y emisión de JWT.
- Evidencia de relación persistente (préstamo que asocia un libro y un usuario).
- Evidencia de filtros, ordenamiento y paginación con metadatos.

---

## 11. Integrantes

1. Nombre y Apellido
2. Nombre y Apellido
3. Nombre y Apellido
4. Nombre y Apellido
