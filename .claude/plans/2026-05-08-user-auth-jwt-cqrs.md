# План: User-модуль и Auth-модуль с JWT через CQRS

**Дата:** 2026-05-08
**Цель:** Поднять домен пользователя и аутентификацию в `apps/api`. Auth не зависит от UserService напрямую — общается через CQRS-шину.

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

- [ ] Установить `bcrypt` и `@nestjs/cqrs` в `apps/api`
  ```bash
  pnpm --filter api add bcrypt @nestjs/cqrs
  ```
- [ ] Установить `@types/bcrypt` и `@types/passport-jwt` (devDependencies)
  ```bash
  pnpm --filter api add -D @types/bcrypt @types/passport-jwt
  ```
- [ ] Убедиться, что Postgres поднят (`pnpm db:up`)

### 2. Prisma модель User

- [ ] Добавить модель `User` в `apps/api/prisma/schema.prisma`:
  ```prisma
  model User {
    id           String   @id @default(uuid()) @db.Uuid
    email        String   @unique @db.VarChar(255)
    name         String   @db.VarChar(255)
    passwordHash String   @db.VarChar(255)
    createdAt    DateTime @default(now())
    updatedAt    DateTime @updatedAt

    @@map("users")
  }
  ```
- [ ] Применить миграцию: `pnpm --filter api exec prisma migrate dev --name init-user`
- [ ] Сгенерировать клиент: `pnpm --filter api exec prisma generate`

### 3. Shared types (контракт)

- [ ] Создать `packages/shared-types/src/auth.ts` с интерфейсами:
  - [ ] `UserPublic` — `{ id, email, name, createdAt, updatedAt }` (даты как ISO-строки)
  - [ ] `RegisterRequest` — `{ email, name, password }`
  - [ ] `LoginRequest` — `{ email, password }`
  - [ ] `AuthResponse` — `{ user: UserPublic, accessToken: string }`
  - [ ] `JwtPayload` — `{ sub: string, email: string }`
- [ ] Добавить `export * from "./auth";` в `packages/shared-types/src/index.ts`

### 4. UserModule (`apps/api/src/user/`)

- [ ] `user.service.ts` — методы `create`, `findByEmail`, `findById` через `PrismaService`
- [ ] `user.mapper.ts` — `toPublic(user): UserPublic` (отрезает passwordHash, даты в ISO)
- [ ] `exceptions/email-already-exists.exception.ts` — extends `ConflictException`
- [ ] **Commands:**
  - [ ] `commands/create-user.command.ts` — `CreateUserCommand({ email, name, passwordHash })`
  - [ ] `commands/handlers/create-user.handler.ts` — проверка дубля → создание
  - [ ] `commands/handlers/index.ts` — массив `CommandHandlers`
- [ ] **Queries:**
  - [ ] `queries/get-user-by-email.query.ts` — `GetUserByEmailQuery({ email })`
  - [ ] `queries/get-user-by-id.query.ts` — `GetUserByIdQuery({ id })`
  - [ ] `queries/handlers/get-user-by-email.handler.ts`
  - [ ] `queries/handlers/get-user-by-id.handler.ts`
  - [ ] `queries/handlers/index.ts` — массив `QueryHandlers`
- [ ] `user.module.ts` — `imports: [CqrsModule]`, `providers: [UserService, ...CommandHandlers, ...QueryHandlers]`

### 5. AuthModule (`apps/api/src/auth/`)

- [ ] **DTO:**
  - [ ] `dto/register.dto.ts` — `RegisterDto implements RegisterRequest` + валидаторы (`@IsEmail`, `@IsString @MinLength(2) @MaxLength(100)` для name, `@IsString @MinLength(8) @MaxLength(72)` для password)
  - [ ] `dto/login.dto.ts` — `LoginDto implements LoginRequest`
- [ ] **Strategies:**
  - [ ] `strategies/jwt.strategy.ts` — `PassportStrategy(Strategy, "jwt")`, `validate` вызывает `queryBus.execute(GetUserByIdQuery)`
- [ ] **Guards & decorators (для экспорта в будущие модули):**
  - [ ] `guards/jwt-auth.guard.ts` — `extends AuthGuard("jwt")`
  - [ ] `decorators/current-user.decorator.ts` — `createParamDecorator → request.user`
  - [ ] `types/jwt-payload.interface.ts` — re-export `JwtPayload` из shared-types
- [ ] **Service:**
  - [ ] `auth.service.ts` — `register` (bcrypt.hash → CreateUserCommand → signToken), `login` (GetUserByEmailQuery → bcrypt.compare → signToken), `signToken`, константа `BCRYPT_SALT_ROUNDS = 10`
- [ ] **Controller:**
  - [ ] `auth.controller.ts` — `POST /register`, `POST /login`, `GET /me` (под `JwtAuthGuard`, через `@CurrentUser()`)
- [ ] **Module:**
  - [ ] `auth.module.ts` — `imports: [CqrsModule, PassportModule, JwtModule.registerAsync({...}), ConfigModule]`, `exports: [JwtAuthGuard]`

### 6. Глобальные изменения

- [ ] `apps/api/src/main.ts` — добавить `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))`
- [ ] `apps/api/src/app.module.ts` — добавить `ConfigModule.forRoot({ isGlobal: true })`, `UserModule`, `AuthModule`

### 7. Верификация end-to-end

- [ ] `pnpm --filter api type-check` — без ошибок
- [ ] `pnpm --filter api lint` — без ошибок
- [ ] `pnpm --filter api dev` — стартует без ошибок
- [ ] **curl-сценарии:**
  - [ ] Регистрация → 201, ответ `{user, accessToken}`
    ```bash
    curl -i -X POST http://localhost:3001/api/auth/register \
      -H 'Content-Type: application/json' \
      -d '{"email":"a@b.com","name":"Alice","password":"secret123"}'
    ```
  - [ ] Повторная регистрация того же email → 409 Conflict
  - [ ] Логин с верным паролем → 200, `{user, accessToken}`
  - [ ] Логин с неверным паролем → 401 `Invalid credentials`
  - [ ] `GET /me` с валидным токеном → 200, `UserPublic`
  - [ ] `GET /me` без токена → 401
  - [ ] DTO-валидация: `password` короче 8 символов → 400 BadRequest

---

## Ловушки и проверки

- `ConfigModule.isGlobal: true` обязателен; в `JwtModule.registerAsync` всё равно явно перечислить `imports: [ConfigModule]`.
- `getOrThrow("JWT_SECRET")` вместо `get` — иначе `undefined` секрет молча сломает подписи.
- `JwtPayload` типизировать одним интерфейсом из shared-types и переиспользовать в `signToken` и `JwtStrategy.validate`.
- bcrypt salt rounds = 10 (константа `BCRYPT_SALT_ROUNDS` в `auth.service.ts`).
- `PrismaModule` уже `@Global()` — НЕ импортировать повторно в `UserModule`.
- Никогда не возвращать сырого Prisma-`User` из контроллера: всегда через `UserMapper.toPublic()`, иначе `passwordHash` утечёт.
- Handler-ы CQRS — обычные DI-классы; забыть положить их в `providers` UserModule = молчаливый «handler not found».
- В `UserPublic` даты — `string` (ISO), не `Date`: иначе разъезжается контракт shared-types между web и api.
- На login возвращать **один** `UnauthorizedException("Invalid credentials")` для обоих кейсов (юзер не найден / пароль не совпал) — чтобы не давать enumeration oracle.
- `password` ограничен 72 символами — bcrypt молча отбрасывает остальное.

---

## Critical files

- `apps/api/prisma/schema.prisma`
- `apps/api/package.json`
- `apps/api/src/main.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/user/**` (создаётся целиком)
- `apps/api/src/auth/**` (создаётся целиком)
- `packages/shared-types/src/auth.ts` (новый)
- `packages/shared-types/src/index.ts` (re-export)
