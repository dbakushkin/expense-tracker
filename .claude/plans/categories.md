# План: CategoryModule с CQRS

**Дата:** 2026-05-08
**Цель:** Добавить домен «категории трат» — сущность Category (id, name, color, icon, userId FK), CRUD-сервис, CRUD-контроллер под JwtAuthGuard. Взаимодействие с UserModule **только через CQRS-шину** (`GetUserByIdQuery` в `CreateCategoryHandler`), без прямого импорта `UserService`.

---

## Context

User+Auth уже реализованы. Категории — личные данные пользователя: только владелец видит/правит/удаляет свои; чужие маскируем через **404** (не 403). Внутренний CQRS-контракт CategoryModule + явная зависимость от UserModule через шину.

### Принятые решения
- **color**: hex `#RRGGBB` строго (6 символов) — `@Matches(/^#[0-9A-Fa-f]{6}$/)`. БД: `VarChar(7)`.
- **icon**: имя иконки (строка) — `@IsString @MinLength(1) @MaxLength(50)`.
- **name**: `@@unique([userId, name])`; дубль → 409.
- **CQRS**: при `create` обязательный `queryBus.execute(GetUserByIdQuery)` перед записью.
- **Cascade delete**: при удалении пользователя его категории удаляются.
- **`@nestjs/mapped-types` НЕ ставим** — `UpdateCategoryDto` пишем руками с `@IsOptional`.
- **Ownership** через композитный `WHERE { id, userId }` (`findFirst`/`updateMany`/`deleteMany`).

---

## Чек-лист задач

### 1. Prisma модель Category

- [x] В `apps/api/prisma/schema.prisma` добавить back-relation в существующую `User`:
  ```prisma
  model User {
    // ... существующие поля
    categories   Category[]
    @@map("users")
  }
  ```
- [x] Добавить новую модель `Category`:
  ```prisma
  model Category {
    id        String   @id @default(uuid()) @db.Uuid
    name      String   @db.VarChar(100)
    color     String   @db.VarChar(7)
    icon      String   @db.VarChar(50)
    userId    String   @db.Uuid
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@unique([userId, name])
    @@index([userId])
    @@map("categories")
  }
  ```
- [x] Применить миграцию: `pnpm --filter api exec prisma migrate dev --name add-category`
- [x] Сгенерировать клиент: `pnpm --filter api exec prisma generate`

### 2. Shared types

- [x] Создать `packages/shared-types/src/category.ts`:
  - [x] `CategoryPublic` — `{ id, name, color, icon, userId, createdAt, updatedAt }` (даты ISO)
  - [x] `CreateCategoryRequest` — `{ name, color, icon }`
  - [x] `UpdateCategoryRequest` — `{ name?, color?, icon? }` (все optional)
- [x] Добавить `export * from "./category";` в `packages/shared-types/src/index.ts`

### 3. CategoryService (`apps/api/src/category/category.service.ts`)

- [x] `create(userId, { name, color, icon }): Promise<Category>` — catch `P2002` → `CategoryNameConflictException`
- [x] `findAllByUser(userId): Promise<Category[]>` — ORDER BY `name ASC`
- [x] `findOneByIdAndUser(id, userId): Promise<Category | null>` — `findFirst({ where: { id, userId } })`
- [x] `update(id, userId, data): Promise<Category>` — `updateMany`, count===0 → `CategoryNotFoundException`, затем `findFirst`; catch `P2002` → 409
- [x] `delete(id, userId): Promise<void>` — `deleteMany`, count===0 → `CategoryNotFoundException`
- [x] **CategoryService не экспортируется** из CategoryModule (паттерн UserModule)

### 4. CategoryMapper

- [x] `category.mapper.ts` — `static toPublic(category: Category): CategoryPublic` (даты в ISO)

### 5. Exceptions

- [x] `exceptions/category-not-found.exception.ts` — `extends NotFoundException("Category not found")` → 404
- [x] `exceptions/category-name-conflict.exception.ts` — `extends ConflictException("Category name already in use")` → 409

### 6. DTO

- [x] `dto/create-category.dto.ts` — `implements CreateCategoryRequest`:
  - [x] `name`: `@IsString @MinLength(1) @MaxLength(100)`
  - [x] `color`: `@IsString @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color must be a hex string in #RRGGBB format' })`
  - [x] `icon`: `@IsString @MinLength(1) @MaxLength(50)`
- [x] `dto/update-category.dto.ts` — `implements UpdateCategoryRequest`, все поля с `@IsOptional` + те же валидаторы

### 7. CQRS Commands

- [x] `commands/create-category.command.ts` — `(userId, name, color, icon)`
- [x] `commands/update-category.command.ts` — `(id, userId, data: UpdateCategoryRequest)`
- [x] `commands/delete-category.command.ts` — `(id, userId)`
- [x] `commands/handlers/create-category.handler.ts`:
  - [x] Инжектит `CategoryService` + `QueryBus`
  - [x] Вызывает `GetUserByIdQuery(cmd.userId)` → null → `UnauthorizedException`
  - [x] `service.create` → `CategoryMapper.toPublic`
- [x] `commands/handlers/update-category.handler.ts` — `service.update` → `CategoryMapper.toPublic`
- [x] `commands/handlers/delete-category.handler.ts` — `service.delete` (return void)
- [x] `commands/handlers/index.ts` — `export const CommandHandlers = [...]`

### 8. CQRS Queries

- [x] `queries/get-categories-by-user-id.query.ts` — `(userId)`
- [x] `queries/get-category-by-id-and-user-id.query.ts` — `(id, userId)`
- [x] `queries/handlers/get-categories-by-user-id.handler.ts` — `service.findAllByUser` → массив через `CategoryMapper.toPublic`
- [x] `queries/handlers/get-category-by-id-and-user-id.handler.ts` — `service.findOneByIdAndUser` → null → `CategoryNotFoundException`, иначе `CategoryMapper.toPublic`
- [x] `queries/handlers/index.ts` — `export const QueryHandlers = [...]`

### 9. CategoryController (под `JwtAuthGuard`)

- [x] `@Controller('categories')` + `@UseGuards(JwtAuthGuard)` на классе
- [x] Инжектит `CommandBus` и `QueryBus` (НЕ CategoryService)
- [x] `POST /` → 201, `@Body() dto: CreateCategoryDto` → `CreateCategoryCommand`
- [x] `GET /` → 200 → `GetCategoriesByUserIdQuery`
- [x] `GET /:id` → 200, `@Param('id', ParseUUIDPipe)` → `GetCategoryByIdAndUserIdQuery`
- [x] `PATCH /:id` → 200, `@Body() dto: UpdateCategoryDto` → `UpdateCategoryCommand`
- [x] `DELETE /:id` → 204 No Content (`@HttpCode(HttpStatus.NO_CONTENT)`, return void), → `DeleteCategoryCommand`
- [x] `@CurrentUser() user: UserPublic` для получения `user.id`

### 10. CategoryModule

- [x] `category.module.ts`:
  ```ts
  @Module({
    imports: [CqrsModule],
    controllers: [CategoryController],
    providers: [CategoryService, ...CommandHandlers, ...QueryHandlers],
  })
  export class CategoryModule {}
  ```

### 11. AppModule

- [x] Добавить `CategoryModule` в `imports` после `AuthModule`
- [x] `UserModule` уже подключён — handler-ы `GetUserByIdQuery` доступны через единую CQRS-шину

### 12. Верификация end-to-end

- [x] `pnpm --filter api exec tsc --noEmit` — без ошибок
- [x] `pnpm --filter api lint` — без ошибок
- [x] `pnpm --filter api dev` — стартует, в логах видны mapped routes для `/api/categories`
- [x] **curl-сценарии** (зарегистрировать двух юзеров, сохранить токены):
  - [x] `POST /api/categories` (валидное) → 201, возвращает `CategoryPublic`
  - [x] `POST /api/categories` (дубль name того же юзера) → 409 Conflict
  - [x] `GET /api/categories` (юзер A) → 200, список с одной категорией
  - [x] `GET /api/categories` (юзер B) → 200, пустой массив `[]`
  - [x] `GET /api/categories/:id` (чужой id под токеном B) → 404 Not Found
  - [x] `PATCH /api/categories/:id` с `{"color":"#00FF00"}` → 200, обновлённая категория
  - [x] `POST /api/categories` с `"color":"red"` → 400 Bad Request
  - [x] `GET /api/categories/not-uuid` → 400 Bad Request
  - [x] `GET /api/categories` без `Authorization` → 401
  - [x] `DELETE /api/categories/:id` (свой) → 204 No Content
  - [x] `DELETE /api/categories/:id` (повторный) → 404 Not Found

---

## Critical files

- `apps/api/prisma/schema.prisma` (добавить Category, обновить User)
- `apps/api/src/app.module.ts` (зарегистрировать CategoryModule)
- `apps/api/src/category/**` (создаётся целиком)
- `packages/shared-types/src/category.ts` (новый)
- `packages/shared-types/src/index.ts` (re-export)

---

## Ловушки

- **Ownership-pattern**: `findUnique({ where: { id } })` + ручная проверка `userId` — анти-паттерн (лишний round-trip + race window). Используем `findFirst`/`updateMany`/`deleteMany` с композитным `WHERE { id, userId }`.
- **Update + возврат записи**: `updateMany` Prisma не возвращает запись — отдельный `findFirst({ where: { id, userId } })` после успешного апдейта.
- **PATCH с пустым телом `{}`**: глобальный `ValidationPipe` пропустит (все поля `@IsOptional`). `updateMany({ data: {} })` валиден, обновляет только `updatedAt`. Поведение идемпотентно.
- **DELETE 204**: тип возврата `Promise<void>`, не возвращать ничего из метода — Nest не сериализует.
- **`@Matches` сообщение**: явно передавать `{ message: '...' }` — иначе ошибка валидации будет невнятной.
- **Cascade**: при удалении юзера категории удаляются (не SetNull).
- **`@@unique([userId, name])`**: ловить P2002 по `code === 'P2002'`, не завязываться на `meta.target`.
- **Порядок модулей в AppModule**: `UserModule` раньше `CategoryModule`.
- **CategoryService не экспортируется** — только через шину (паттерн UserModule).
- **CqrsModule в фиче-модуле**: `@nestjs/cqrs@11` требует импорта в каждом модуле, регистрирующем handlers.
- **JwtStrategy уже верифицировал юзера** — `GetUserByIdQuery` в `CreateCategoryHandler` дублирует. Это сознательное требование пользователя для явной CQRS-зависимости. На остальные операции не распространяем.
- **`ParseUUIDPipe`** на всех `:id` параметрах — отсечёт мусор до Prisma (иначе P2023).
