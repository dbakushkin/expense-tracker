# Expence Tracker

Монорепозиторий трекера расходов.

> **Статус:** scaffold only — структура заложена, зависимости ещё не установлены.

## Стек

- **Монорепо:** Turborepo + pnpm workspaces
- **Frontend:** Next.js (App Router) + Tailwind CSS + shadcn/ui — `apps/web`
- **Backend:** NestJS — `apps/api`
- **БД:** PostgreSQL (Docker Compose для разработки)
- **ORM:** Prisma — `apps/api/prisma`
- **Auth:** JWT, выдаваемый NestJS, хранится во фронте в httpOnly cookie

## Структура

```
.
├── apps/
│   ├── web/        # Next.js
│   └── api/        # NestJS + Prisma
├── packages/
│   ├── eslint-config/
│   ├── tsconfig/
│   └── shared-types/
└── docker-compose.yml
```

## Как запустить (после установки зависимостей)

```bash
# 1. Установить зависимости
pnpm install

# 2. Скопировать .env
cp .env.example .env

# 3. Поднять PostgreSQL
pnpm db:up

# 4. Применить миграции Prisma (после первой модели)
pnpm --filter @expence-tracker/api prisma migrate dev

# 5. Запустить весь стек
pnpm dev
```

## Скрипты в корне

- `pnpm dev` — запустить все приложения (turbo run dev)
- `pnpm build` — собрать все приложения
- `pnpm lint` — линт по всему репо
- `pnpm type-check` — TypeScript проверка
- `pnpm db:up` / `pnpm db:down` — поднять/остановить PostgreSQL

## Требования

- Node.js >= 20 (`.nvmrc`)
- pnpm 9
- Docker + Docker Compose (для PostgreSQL)
