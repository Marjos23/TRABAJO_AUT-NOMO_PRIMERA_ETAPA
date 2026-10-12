# README de ejemplos SQL

Ejemplos en **lenguaje de base de datos (SQL / PostgreSQL)** para insertar,
consultar, actualizar y borrar datos del proyecto de biblioteca.

> Este archivo es independiente de `docs/GUIA_DBEAVER.md`. Aquí solo hay SQL listo
> para copiar y pegar en DBeaver (o `psql`) y ejecutar con **Alt+X**.
>
> Recuerda: en `users.password` se guarda un **hash bcrypt**, nunca texto plano.

---

## 0. Estructura de las tablas

| Tabla | Columnas principales |
|---|---|
| `users` | id, name, email, password, role, created_at, updated_at |
| `books` | id, title, author, isbn, category, year, copies |
| `loans` | id, book_id, user_id, loan_date, due_date, return_date, status, created_at, updated_at |
| `fines` | id, loan_id, amount, reason, paid, created_at |

- `users.role` → `'librarian'` o `'reader'`
- `loans.status` → `'active'`, `'returned'` u `'overdue'`
- Las columnas `id` son `SERIAL`: **no las escribas**, se generan solas.

---

## 1. USUARIOS (`users`)

### 1.1 Insertar un usuario

```sql
INSERT INTO users (name, email, password, role)
VALUES (
  'Ana Librera',
  'ana@biblioteca.com',
  '$2b$10$.UjW/fstngXaZVNEpnJmtOHGoNccUj3JKnvHEpOCKRdbQHQ9/P006', -- Secreta123
  'librarian'
);
```

### 1.2 Insertar varios usuarios a la vez

```sql
INSERT INTO users (name, email, password, role) VALUES
  ('Ana Librera',  'ana@biblioteca.com',
   '$2b$10$.UjW/fstngXaZVNEpnJmtOHGoNccUj3JKnvHEpOCKRdbQHQ9/P006', 'librarian'),
  ('Pedro Lector', 'pedro@biblioteca.com',
   '$2b$10$oC60.RPg5HIa23jMOMRabusUimvjaaIXtN9cmrDJ8V0zbykPvATFa', 'reader');
```

### 1.3 Insertar sin duplicar (si el email ya existe, lo ignora)

```sql
INSERT INTO users (name, email, password, role)
VALUES ('Pedro Lector', 'pedro@biblioteca.com',
        '$2b$10$oC60.RPg5HIa23jMOMRabusUimvjaaIXtN9cmrDJ8V0zbykPvATFa', 'reader')
ON CONFLICT (email) DO NOTHING;
```

### 1.4 Insertar y devolver la fila creada

```sql
INSERT INTO users (name, email, password, role)
VALUES ('Luis', 'luis@biblioteca.com',
        '$2b$10$oC60.RPg5HIa23jMOMRabusUimvjaaIXtN9cmrDJ8V0zbykPvATFa', 'reader')
RETURNING id, name, email, role;
```

### 1.5 Consultar

```sql
SELECT id, name, email, role FROM users;                 -- todos
SELECT * FROM users WHERE email = 'ana@biblioteca.com';  -- por email
SELECT * FROM users WHERE role = 'librarian';            -- por rol
```

### 1.6 Actualizar

```sql
UPDATE users SET role = 'librarian' WHERE email = 'ana@biblioteca.com';
UPDATE users SET name = 'Ana M. Librera' WHERE id = 1;
```

### 1.7 Borrar

```sql
DELETE FROM users WHERE email = 'luis@biblioteca.com';
```

> Al borrar un usuario, sus préstamos se eliminan en cascada (`ON DELETE CASCADE`).

---

## 2. LIBROS (`books`)

### 2.1 Insertar un libro

```sql
INSERT INTO books (title, author, isbn, category, year, copies)
VALUES ('Clean Code', 'Robert C. Martin', '9780132350884', 'Tecnologia', 2008, 5);
```

### 2.2 Insertar varios libros sin duplicar el ISBN

```sql
INSERT INTO books (title, author, isbn, category, year, copies) VALUES
  ('Clean Code',            'Robert C. Martin',        '9780132350884', 'Tecnologia', 2008, 5),
  ('Cien años de soledad',  'Gabriel García Márquez',  '9780307474728', 'Novela',     1967, 3),
  ('El principito',         'Antoine de Saint-Exupéry','9780156012195', 'Infantil',   1943, 4)
ON CONFLICT (isbn) DO NOTHING;
```

### 2.3 Consultar (con filtros)

```sql
SELECT id, title, author, isbn, copies FROM books;
SELECT * FROM books WHERE category = 'Novela';
SELECT * FROM books WHERE year >= 2000;
SELECT * FROM books WHERE copies > 0;
SELECT * FROM books WHERE title ILIKE '%clean%';   -- búsqueda parcial
```

### 2.4 Actualizar

```sql
UPDATE books SET copies = copies - 1 WHERE isbn = '9780132350884'; -- prestar
UPDATE books SET copies = copies + 1 WHERE isbn = '9780132350884'; -- devolver
UPDATE books SET title = 'Clean Code, 2nd Ed.' WHERE id = 1;
```

### 2.5 Borrar

```sql
DELETE FROM books WHERE isbn = '9780156012195';
```

> No se puede borrar un libro con préstamos asociados (`ON DELETE RESTRICT`);
> primero hay que borrar o mover sus préstamos.

---

## 3. PRÉSTAMOS (`loans`)

### 3.1 Insertar un préstamo (usando los id a mano)

```sql
INSERT INTO loans (book_id, user_id, loan_date, due_date, status)
VALUES (1, 2, now(), now() + interval '14 days', 'active');
```

### 3.2 Insertar un préstamo sin conocer los id (por email e ISBN)

```sql
INSERT INTO loans (book_id, user_id, loan_date, due_date, status)
SELECT b.id, u.id, now(), now() + interval '14 days', 'active'
FROM books b, users u
WHERE b.isbn = '9780132350884'
  AND u.email = 'pedro@biblioteca.com';
```

### 3.3 Insertar y devolver el préstamo creado

```sql
INSERT INTO loans (book_id, user_id, loan_date, due_date, status)
VALUES (1, 2, now(), now() + interval '14 days', 'active')
RETURNING id, book_id, user_id, status;
```

### 3.4 Consultar con datos relacionados (JOIN)

```sql
SELECT l.id, u.email AS usuario, b.title AS libro, l.loan_date, l.due_date, l.status
FROM loans l
JOIN users u ON u.id = l.user_id
JOIN books b ON b.id = l.book_id
ORDER BY l.loan_date DESC;
```

```sql
SELECT * FROM loans WHERE status = 'active';
SELECT * FROM loans WHERE user_id = 2;
SELECT * FROM loans WHERE book_id = 1;
```

### 3.5 Registrar la devolución

```sql
UPDATE loans
SET return_date = now(), status = 'returned'
WHERE id = 1;
```

### 3.6 Marcar un préstamo como vencido

```sql
UPDATE loans SET status = 'overdue'
WHERE due_date < now() AND status = 'active';
```

### 3.7 Borrar

```sql
DELETE FROM loans WHERE id = 1;
```

> Al borrar un préstamo, sus multas se eliminan en cascada (`ON DELETE CASCADE`).

---

## 4. MULTAS (`fines`)

### 4.1 Insertar una multa (con el id del préstamo)

```sql
INSERT INTO fines (loan_id, amount, reason, paid)
VALUES (1, 2.50, 'Devolucion tardia', false);
```

### 4.2 Insertar una multa por email del usuario

```sql
INSERT INTO fines (loan_id, amount, reason, paid)
SELECT l.id, 2.50, 'Devolucion tardia', false
FROM loans l
JOIN users u ON u.id = l.user_id
WHERE u.email = 'pedro@biblioteca.com';
```

### 4.3 Consultar (con el préstamo y el usuario)

```sql
SELECT f.id, f.amount, f.reason, f.paid, u.email AS usuario
FROM fines f
JOIN loans l ON l.id = f.loan_id
JOIN users u ON u.id = l.user_id;

SELECT * FROM fines WHERE paid = false;
```

### 4.4 Marcar como pagada

```sql
UPDATE fines SET paid = true WHERE id = 1;
```

### 4.5 Borrar

```sql
DELETE FROM fines WHERE id = 1;
```

---

## 5. Consultas de reporte (varias tablas)

```sql
-- Cuántos préstamos tiene cada usuario
SELECT u.email, COUNT(l.id) AS total_prestamos
FROM users u
LEFT JOIN loans l ON l.user_id = u.id
GROUP BY u.email
ORDER BY total_prestamos DESC;
```

```sql
-- Total de multas pendientes por usuario
SELECT u.email, SUM(f.amount) AS total_pendiente
FROM fines f
JOIN loans l ON l.id = f.loan_id
JOIN users u ON u.id = l.user_id
WHERE f.paid = false
GROUP BY u.email;
```

```sql
-- Libros con más préstamos
SELECT b.title, COUNT(l.id) AS veces_prestado
FROM books b
LEFT JOIN loans l ON l.book_id = b.id
GROUP BY b.title
ORDER BY veces_prestado DESC;
```

---

## 6. Transacciones (todo o nada)

Si un conjunto de operaciones debe ser atómico, usa `BEGIN` / `COMMIT`:

```sql
BEGIN;

INSERT INTO loans (book_id, user_id, loan_date, due_date, status)
VALUES (1, 2, now(), now() + interval '14 days', 'active');

UPDATE books SET copies = copies - 1 WHERE id = 1;

COMMIT;   -- si algo falla, usa ROLLBACK; para deshacer
```

---

## 7. Limpiar todo y reiniciar los id

```sql
TRUNCATE TABLE fines, loans, books, users RESTART IDENTITY CASCADE;
```

> No borres la tabla `migrations`.

---

## 8. Generar un hash bcrypt para una contraseña nueva

Las contraseñas se guardan cifradas. Para crear el hash de `TuClave123`:

```bash
node -e "console.log(require('bcrypt').hashSync('TuClave123',10))"
```

Copia el resultado (algo como `$2b$10$...`) y úsalo en `users.password`.
