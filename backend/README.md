# CityFix API

Express + Prisma (PostgreSQL) + Zod. Los schemas y DTOs compartidos viven en `shared/` (`@cityfix/shared`).

## Arranque local

```bash
docker compose -f docker-compose.dev.yml up -d   # Postgres (desde la raíz)
npm install                                      # desde la raíz (workspaces)
cp backend/.env.example backend/.env             # y ajustar JWT_ACCESS_SECRET (≥32 chars)
cd backend
npx prisma migrate dev && npm run db:seed        # admin@cityfix.local / Admin1234!
npm run dev                                      # http://localhost:3000/api
npm test                                         # BD aislada cityfix_test (se crea sola)
```

Variables de entorno (validadas con Zod al arrancar): `DATABASE_URL`, `JWT_ACCESS_SECRET`, `ACCESS_TTL` (15m),
`REFRESH_TTL_DAYS` (7), `PORT`, `UPLOAD_DIR`, `AUTH_RATE_LIMIT_MAX` (10), `API_RATE_LIMIT_MAX` (300),
`TRUST_PROXY` (1 detrás de nginx/compose).

## Convenciones

- Base URL: `/api`. JSON salvo `POST /reports` (multipart).
- Autenticación: `Authorization: Bearer <accessToken>`.
- IDs: UUID. Fechas: ISO 8601.
- Paginación: `?page=1&limit=20` (limit máx. 100) → `{ data: [...], meta: { page, limit, total, totalPages } }`.
- Errores, siempre con este formato:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Datos inválidos", "details": { "email": ["Invalid email"] } } }
```

| Status | code | Cuándo |
|---|---|---|
| 400 | `VALIDATION_ERROR` / `BAD_REQUEST` / `UPLOAD_ERROR` | Datos, id, JSON o imagen inválidos |
| 401 | `UNAUTHORIZED` | Sin token, token expirado o credenciales malas |
| 403 | `FORBIDDEN` | Sin permisos (rol o no eres el dueño) |
| 404 | `NOT_FOUND` | Recurso o ruta inexistente |
| 409 | `CONFLICT` | Email/categoría duplicada, categoría con reportes |
| 429 | `RATE_LIMITED` | Demasiadas solicitudes (headers `RateLimit-*`) |

## Auth

| Método y ruta | Body | Respuesta |
|---|---|---|
| `POST /auth/register` | `{ name, email, password }` (pass 8–72) | 201 `{ user, accessToken, refreshToken }` |
| `POST /auth/login` | `{ email, password }` | 200 `{ user, accessToken, refreshToken }` |
| `POST /auth/refresh` | `{ refreshToken }` | 200 `{ accessToken, refreshToken }` |
| `POST /auth/logout` | `{ refreshToken }` | 204 (idempotente) |
| `GET /auth/me` (requiere token) | — | 200 `UserDto` |

`register` y `login` tienen límite de 10 intentos / 15 min por IP.

**Cómo manejar los tokens en web y móvil**
- El access token dura 15 min. Al recibir 401 en una petición, llama a `/auth/refresh` **una sola vez** (si hay varias peticiones
  fallando a la vez, que compartan esa misma llamada) y reintenta.
- El refresh token **rota en cada uso**: guarda siempre el nuevo y descarta el viejo.
- Si un refresh token ya usado se presenta otra vez, se asume robo y se **revoca toda la sesión**: el siguiente refresh da 401
  y hay que volver a hacer login.
- Si `/auth/refresh` da 401, borra los tokens y manda al usuario a login.
- Móvil: guarda el refresh token en almacenamiento seguro (Keychain/Keystore).

## Categories

| Ruta | Acceso | Body |
|---|---|---|
| `GET /categories` | público | — → `[{ id, name }]` |
| `POST /categories` | admin | `{ name }` → 201 |
| `PUT /categories/:id` | admin | `{ name }` |
| `DELETE /categories/:id` | admin | 204; 409 si tiene reportes |

## Reports

`ReportDto`: `{ id, title, description, imageUrl, latitude, longitude, status, category:{id,name}, author:{id,name}, commentsCount, createdAt, updatedAt }`.
`status`: `PENDING | IN_PROGRESS | RESOLVED | REJECTED`.

| Ruta | Acceso | Notas |
|---|---|---|
| `GET /reports` | público | Filtros: `status`, `categoryId`, `authorId`, `q` (título/descripción), `sortBy` (`createdAt\|updatedAt\|status`), `order` (`asc\|desc`), `page`, `limit` |
| `GET /reports/:id` | público | |
| `POST /reports` | ciudadano/admin | **multipart/form-data**: `title` (3–120), `description` (10–2000), `categoryId`, `latitude?`, `longitude?`, `image?` |
| `PUT /reports/:id` | dueño o admin | `{ title?, description?, categoryId? }`. El dueño solo mientras esté `PENDING` |
| `PATCH /reports/:id/status` | admin | `{ status }`; registra historial. 400 si ya tiene ese estado |
| `DELETE /reports/:id` | dueño o admin | 204; borra también la imagen |
| `GET /reports/:id/history` | público | `[{ id, from, to, changedBy:{id,name}, createdAt }]` (`from` es `null` en la creación) |

**Imagen**: campo `image`, JPEG/PNG/WebP, máx. 5 MB (se valida el contenido real, no solo el MIME). `imageUrl` es una ruta
relativa (`/uploads/<uuid>.png`); se sirve desde el mismo host de la API: `http://host:3000` + `imageUrl`.

```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Authorization: Bearer $TOKEN" \
  -F title="Bache en la esquina" -F description="Bache profundo frente al parque" \
  -F categoryId=$CAT -F latitude=19.43 -F longitude=-99.13 -F image=@foto.png
```

## Comments

`CommentDto`: `{ id, content, reportId, author:{id,name}, createdAt }`.

| Ruta | Acceso | Notas |
|---|---|---|
| `GET /reports/:id/comments` | público | Paginado, más antiguos primero |
| `POST /reports/:id/comments` | autenticado | `{ content }` (1–1000) → 201 |
| `DELETE /comments/:id` | autor o admin | 204 |

Toda ruta que no esté marcada como pública requiere `Authorization: Bearer <accessToken>`.

## Estructura

```
src/routes → controllers → services → repositories (Prisma)
src/middlewares   authenticate, requireRole, validate(zod), upload, rateLimit, error
src/lib           AppError, asyncHandler, paginación, archivos
tests/            Supertest contra cityfix_test
```
