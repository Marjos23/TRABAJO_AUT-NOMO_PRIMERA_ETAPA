# Guía para crear datos desde DBeaver

Esta guía permite insertar registros de ejemplo en la base `biblioteca_db`
directamente desde DBeaver (o cualquier cliente SQL) respetando el **modelo
relacional** y las **reglas de integridad** de la Segunda Etapa.

> Importante: la API cifra las contraseñas con **bcrypt**. Si insertas un usuario
> con la contraseña en texto plano, **el login no funcionará**. Usa los hashes ya
> generados que están más abajo (o genera uno nuevo).

---

## 1. Conexión en DBeaver

| Campo | Valor |
|---|---|
| Motor | PostgreSQL |
| Servidor | `localhost` |
| Puerto | `5432` |
| Base de datos | `biblioteca_db` |
| Usuario | `postgres` |
| Contraseña | `biblioteca123` |

Al terminar el script, pulsa **Commit** (o activa el autocommit) para guardar los
cambios, y refresca con **F5** para ver las filas.

---

## 2. Orden de inserción (por las claves foráneas)

No se puede insertar en cualquier orden, porque existen claves foráneas:

```
1) users         (no depende de nadie)
2) books         (no depende de nadie)
3) loans         (depende de users y books)
4) fines         (depende de loans)
```

Las reglas de borrado son:

- `loans.user_id` → `ON DELETE CASCADE`
- `loans.book_id` → `ON DELETE RESTRICT` (no se borra un libro con préstamos)
- `fines.loan_id` → `ON DELETE CASCADE`

---

## 3. Script completo de ejemplo

Copia y pega todo en el editor SQL de DBeaver y ejecútalo con **Alt+X**. El
script es *idempotente*: si lo ejecutas otra vez, no duplica filas ni da error.

```sql
-- ============================================================
-- 1) USUARIOS
-- La columna password guarda un HASH bcrypt (NO texto plano).
-- ============================================================
INSERT INTO users (name, email, password, role) VALUES
  ('Ana Librera', 'ana@biblioteca.com',
   '$2b$10$.UjW/fstngXaZVNEpnJmtOHGoNccUj3JKnvHEpOCKRdbQHQ9/P006',
   'librarian'),
  ('Pedro Lector', 'pedro@biblioteca.com',
   '$2b$10$oC60.RPg5HIa23jMOMRabusUimvjaaIXtN9cmrDJ8V0zbykPvATFa',
   'reader')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- 2) LIBROS  (isbn es unico)
-- ============================================================
INSERT INTO books (title, author, isbn, category, year, copies) VALUES
  ('Clean Code', 'Robert C. Martin', '9780132350884', 'Tecnologia', 2008, 5),
  ('Cien años de soledad', 'Gabriel García Márquez', '9780307474728', 'Novela', 1967, 3),
  ('El principito', 'Antoine de Saint-Exupéry', '9780156012195', 'Infantil', 1943, 4)
ON CONFLICT (isbn) DO NOTHING;

-- ============================================================
-- 3) PRESTAMOS  (asocian un libro con un usuario)
-- Usamos subconsultas para no escribir los id a mano.
-- ============================================================
INSERT INTO loans (book_id, user_id, loan_date, due_date, status)
SELECT b.id, u.id, now(), now() + interval '14 days', 'active'
FROM books b, users u
WHERE b.isbn = '9780132350884'
  AND u.email = 'pedro@biblioteca.com'
  AND NOT EXISTS (
    SELECT 1 FROM loans l
    WHERE l.book_id = b.id AND l.user_id = u.id AND l.status = 'active'
  );

-- ============================================================
-- 4) MULTAS  (dependen de un prestamo)
-- ============================================================
INSERT INTO fines (loan_id, amount, reason, paid)
SELECT l.id, 2.50, 'Devolucion tardia', false
FROM loans l
JOIN users u ON u.id = l.user_id
WHERE u.email = 'pedro@biblioteca.com'
  AND NOT EXISTS (SELECT 1 FROM fines f WHERE f.loan_id = l.id);
```

### Contraseñas de los usuarios de ejemplo

| Email | Contraseña real | Rol |
|---|---|---|
| `ana@biblioteca.com` | `Secreta123` | librarian |
| `pedro@biblioteca.com` | `Lector123` | reader |

Con esas credenciales puedes hacer `POST /auth/login` y obtener el JWT.

> `ON CONFLICT ... DO NOTHING` **no actualiza** las filas que ya existen: solo
> inserta las que faltan. Si necesitas cambiar un dato ya guardado, usa `UPDATE`,
> por ejemplo:
> `UPDATE users SET role = 'librarian' WHERE email = 'ana@biblioteca.com';`

---

## 4. Verificar lo insertado

```sql
SELECT id, name, email, role FROM users;

SELECT id, title, author, isbn, copies FROM books;

SELECT l.id, u.email AS usuario, b.title AS libro, l.loan_date, l.status
FROM loans l
JOIN users u ON u.id = l.user_id
JOIN books b ON b.id = l.book_id;

SELECT f.id, f.amount, f.reason, f.paid, f.loan_id FROM fines f;
```

En la API puedes confirmar que la relación quedó guardada:

```bash
# con el token de login
curl "http://localhost:3000/users/1/loans" -H "Authorization: Bearer $TOKEN"
curl "http://localhost:3000/books/1/loans"
```

---

## 5. Valores permitidos en las columnas tipo ENUM

- `users.role`: `librarian` o `reader`
- `loans.status`: `active`, `returned` u `overdue`

Si escribes otro valor, PostgreSQL lanzará un error.

---

## 6. Generar tu propio hash bcrypt

La contraseña nunca debe guardarse en texto. Para crear un hash nuevo ejecuta en
la terminal (con Node instalado):

```bash
node -e "console.log(require('bcrypt').hashSync('TuClave123',10))"
```

Copia el resultado y úsalo en la columna `password`.

---

## 7. Limpiar y reiniciar los datos

Para dejar la base vacía y reiniciar los ID automáticos:

```sql
TRUNCATE TABLE fines, loans, books, users RESTART IDENTITY CASCADE;
```

- `RESTART IDENTITY` reinicia los contadores `id` a 1.
- `CASCADE` borra primero las filas relacionadas, respetando las claves foráneas.

> No borres la tabla `migrations`: ahí se registra qué migración ya se aplicó.

---

## 8. Errores frecuentes

| Mensaje de PostgreSQL | Causa |
|---|---|
| `duplicate key value violates unique constraint` | Email o ISBN repetido |
| `insert or update on table "loans" violates foreign key constraint` | El `book_id` o `user_id` no existe |
| `invalid input value for enum` | Se usó un rol o estado no permitido |
| Al insertar usuario el login falla | La contraseña se guardó en texto plano en vez de hash bcrypt |
| El `id` nuevo choca con uno existente | Se insertaron `id` manualmente y la secuencia no avanzó |

Cuando insertes manualmente, **no escribas la columna `id`**: deja que la
secuencia lo genere automáticamente (`SERIAL`).
