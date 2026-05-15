# Expence Tracker

Монорепозиторий трекера расходов.

## Стек

- **Монорепо:** Turborepo + pnpm workspaces
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS + shadcn/ui — `apps/web`
- **Backend:** NestJS 10 — `apps/api`
- **БД:** PostgreSQL 16 (Docker Compose для разработки)
- **ORM:** Prisma 5 — `apps/api/prisma`
- **Auth:** JWT, выдаваемый NestJS, хранится во фронте в httpOnly cookie

## Реализовано

### Backend (NestJS)

- **Auth:** регистрация, логин, `GET /api/auth/me`, логаут — JWT через httpOnly cookie
- **Categories:** CRUD `/api/categories` — личные категории пользователя, CQRS
- **Transactions:** CRUD `/api/transactions` с агрегацией по месяцу/году, CQRS

### Frontend (Next.js)

- **Аутентификация:** страницы `/login` и `/register` с валидацией (zod) и принятием условий
- **Dashboard:** защищённая страница с таблицей транзакций, пагинацией и именами категорий
- **Создание транзакции:** диалоговое окно с выбором типа (доход/расход), суммы, даты, категории

## Структура

```
.
├── apps/
│   ├── web/        # Next.js (FSD: app/views/widgets/features/entities/shared)
│   └── api/        # NestJS + Prisma (Auth, Category, Transaction)
├── packages/
│   ├── eslint-config/
│   ├── tsconfig/
│   └── shared-types/   # Только TypeScript-типы, без runtime зависимостей
└── docker-compose.yml
```

## Как запустить

```bash
# 1. Установить зависимости
pnpm install

# 2. Скопировать .env
cp .env.example .env

# 3. Поднять PostgreSQL
pnpm db:up

# 4. Применить миграции
pnpm --filter @expence-tracker/api prisma migrate dev

# 5. Запустить весь стек
pnpm dev
```

API — `http://localhost:3001/api`, фронт — `http://localhost:3000`.

## Скрипты

- `pnpm dev` — запустить все приложения (turbo)
- `pnpm build` — собрать все приложения
- `pnpm lint` — линт по всему репо
- `pnpm type-check` — TypeScript проверка
- `pnpm db:up` / `pnpm db:down` — поднять/остановить PostgreSQL

## Требования

- Node.js >= 20 (`.nvmrc`)
- pnpm 9
- Docker + Docker Compose (для PostgreSQL)
