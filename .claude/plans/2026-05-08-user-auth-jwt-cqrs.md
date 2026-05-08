# План: User-модуль и Auth-модуль с JWT через CQRS

**Дата:** 2026-05-08
**Цель:** Поднять домен пользователя и аутентификацию в `apps/api`. Auth не зависит от UserService напрямую — общается через CQRS-шину.
**Статус: ✅ ВЫПОЛНЕНО**

---

## Context

В `apps/api` сейчас только scaffold: `app.module.ts` + `PrismaModule`, пустая `prisma/schema.prisma`. План добавляет регистрацию, логин по JWT и базовый guard для будущих модулей (Expense/Category).

### Принятые решения
- **Хеширование:** `bcrypt` (salt rounds = 10).
- **Регистрация:** auto-login — `/auth/register` сразу возвращает `{ user, accessToken }`.
- **JWT payload:** `{ sub: userId, email }`. TTL — `JWT_EXPIRES_IN` (`7d`), секрет — `JWT_SECRET`.
- **Refresh token:** не делаем (отдельная итерация).
- **Endpoints:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` + экспортируемые `JwtAuthGuard` и `@CurrentUser()`.
- **Контракт:** интерфейсы в `packages/shared-types/src/auth.ts`, `class-validator`-DTO в `apps/api/src/auth/dto`.
- **CQRS:** commands/queries и handler-ы внутри `UserModule`. `AuthModule` НЕ импортирует `UserService`. `CqrsModule` локально в каждом модуле.

---

## Чек-лист задач

### 1. Зависимости и инфраструктура

- [x] Установить `bcrypt` и `@nestjs/cqrs` в `apps/api`
- [x] Установить `@types/bcrypt` и `@types/passport-jwt` (devDependencies)
- [x] Убедиться, что Postgres поднят (`pnpm db:up`)

### 2. Prisma модель User

- [x] Добавить модель `User` в `apps/api/prisma/schema.prisma`
- [x] Применить миграцию: `init-user`
- [x] Сгенерировать клиент

### 3. Shared types (контракт)

- [x] Создать `packages/shared-types/src/auth.ts` с интерфейсами:
  - [x] `UserPublic` — `{ id, email, name, createdAt, updatedAt }` (даты как ISO-строки)
  - [x] `RegisterRequest` — `{ email, name, password }`
  - [x] `LoginRequest` — `{ email, password }`
  - [x] `AuthResponse` — `{ user: UserPublic, accessToken: string }`
  - [x] `JwtPayload` — `{ sub: string, email: string }`
- [x] Добавить `export * from "./auth";` в `packages/shared-types/src/index.ts`

### 4. UserModule (`apps/api/src/user/`)

- [x] `user.service.ts` — методы `create`, `findByEmail`, `findById` через `PrismaService`
  - [x] P2002 race condition → `EmailAlreadyExistsException`
- [x] `user.mapper.ts` — `toPublic(user): UserPublic` (отрезает passwordHash, даты в ISO)
- [x] `exceptions/email-already-exists.exception.ts` — extends `ConflictException`
- [x] **Commands:**
  - [x] `commands/create-user.command.ts`
  - [x] `commands/handlers/create-user.handler.ts` — проверка дубля → создание → возвращает `UserPublic`
  - [x] `commands/handlers/index.ts`
- [x] **Queries:**
  - [x] `queries/get-user-by-email.query.ts`
  - [x] `queries/get-user-by-id.query.ts`
  - [x] `queries/handlers/get-user-by-email.handler.ts`
  - [x] `queries/handlers/get-user-by-id.handler.ts`
  - [x] `queries/handlers/index.ts`
- [x] `user.module.ts` — `imports: [CqrsModule]`, `providers: [UserService, ...CommandHandlers, ...QueryHandlers]`

### 5. AuthModule (`apps/api/src/auth/`)

- [x] **DTO:**
  - [x] `dto/register.dto.ts` — валидаторы + `implements RegisterRequest`
  - [x] `dto/login.dto.ts` — `implements LoginRequest`
- [x] **Strategies:**
  - [x] `strategies/jwt.strategy.ts` — `GetUserByIdQuery` → `UserMapper.toPublic`
- [x] **Guards & decorators:**
  - [x] `guards/jwt-auth.guard.ts` — `extends AuthGuard("jwt")`
  - [x] `decorators/current-user.decorator.ts` — `request.user`
  - [x] `types/jwt-payload.interface.ts` — re-export из shared-types
- [x] **Service:**
  - [x] `auth.service.ts` — register / login (единый UnauthorizedException) / signToken
  - [x] `BCRYPT_SALT_ROUNDS = 10`
- [x] **Controller:**
  - [x] `POST /register` → 201, `POST /login` → 200, `GET /me` → 200 под JwtAuthGuard
- [x] **Module:**
  - [x] `auth.module.ts` — `exports: [JwtAuthGuard]`

### 6. Глобальные изменения

- [x] `apps/api/src/main.ts` — `ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })`
- [x] `apps/api/src/app.module.ts` — `ConfigModule.forRoot({ isGlobal: true })`, `UserModule`, `AuthModule`

### 7. Верификация end-to-end

- [x] `pnpm --filter api type-check` — 0 ошибок
- [x] `pnpm --filter api dev` — стартует без ошибок
- [x] **curl-сценарии:**
  - [x] Регистрация → 201, ответ `{user, accessToken}` ✅
  - [x] Повторная регистрация того же email → 409 Conflict ✅
  - [x] Логин с верным паролем → 200, `{user, accessToken}` ✅
  - [x] Логин с неверным паролем → 401 `Invalid credentials` ✅
  - [x] `GET /me` с валидным токеном → 200, `UserPublic` ✅
  - [x] `GET /me` без токена → 401 ✅
  - [x] DTO-валидация: `password` короче 8 символов → 400 BadRequest ✅

---

## Git история

```
b3b05f1 feat(app): wire UserModule, AuthModule, ConfigModule and ValidationPipe
07885ce feat(auth): add AuthModule with JWT register/login/me and JwtAuthGuard
838c6d9 fix(user): handle P2002 race condition, return UserPublic from CreateUserHandler
3a3135e feat(user): add UserModule with CQRS commands and queries
5fe9fc8 Initial scaffold: NestJS + Next.js monorepo (Turborepo + pnpm)
```

## Ловушки и проверки

- `ConfigModule.isGlobal: true` обязателен; в `JwtModule.registerAsync` всё равно явно перечислить `imports: [ConfigModule]`.
- `getOrThrow("JWT_SECRET")` вместо `get` — иначе `undefined` секрет молча сломает подписи.
- `JwtPayload` типизировать одним интерфейсом из shared-types и переиспользовать в `signToken` и `JwtStrategy.validate`.
- bcrypt salt rounds = 10 (константа `BCRYPT_SALT_ROUNDS` в `auth.service.ts`).
- `PrismaModule` уже `@Global()` — НЕ импортировать повторно в `UserModule`.
- Никогда не возвращать сырого Prisma-`User` из контроллера: всегда через `UserMapper.toPublic()`.
- Handler-ы CQRS — обычные DI-классы; забыть положить их в `providers` UserModule = молчаливый «handler not found».
- В `UserPublic` даты — `string` (ISO), не `Date`.
- На login возвращать **один** `UnauthorizedException("Invalid credentials")` для обоих кейсов.
- `password` ограничен 72 символами — bcrypt молча отбрасывает остальное.
