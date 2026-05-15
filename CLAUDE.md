# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

**Scaffold only** — структура и конфиги заложены, но `pnpm install` ещё не выполнялся, версии зависимостей не зафиксированы. Поля `dependencies`/`devDependencies` в `package.json` либо пусты, либо содержат только workspace-ссылки. Перед первым запуском нужно решить:

1. Какие версии зависимостей фиксировать (Next.js, NestJS, Prisma, Tailwind, shadcn/ui).
2. Запустить `pnpm install`.
3. `pnpm --filter @expence-tracker/api prisma generate` (после установки `@prisma/client` и `prisma`).

До этого все ниже перечисленные команды — целевые, не рабочие.

## Commands (после установки зависимостей)

В корне:

```bash
pnpm dev              # turbo run dev — запускает web и api параллельно
pnpm build            # turbo run build с зависимостью ^build
pnpm lint             # turbo run lint
pnpm type-check       # turbo run type-check (tsc --noEmit во всех пакетах)
pnpm format           # prettier --write по всему репо
pnpm db:up / db:down  # docker compose up/down для PostgreSQL
```

Точечно по пакету:

```bash
pnpm --filter @expence-tracker/web dev
pnpm --filter @expence-tracker/api dev          # nest start --watch
pnpm --filter @expence-tracker/api prisma migrate dev --name <name>
pnpm --filter @expence-tracker/api prisma studio
pnpm --filter @expence-tracker/api test                    # jest
pnpm --filter @expence-tracker/api test -- --testNamePattern '<name>'  # одиночный тест
pnpm --filter @expence-tracker/api test:e2e               # jest --config test/jest-e2e.json
```

API запускается на `http://localhost:3001/api`, фронт — на `http://localhost:3000`. Health-check: `GET /api/health`.

## Architecture

### Монорепо

- **Менеджер:** pnpm 9 + workspaces (`apps/*`, `packages/*`).
- **Оркестратор:** Turborepo. Pipeline в `turbo.json`: `build` зависит от `^build` и кеширует `dist/**` и `.next/**`; `dev` помечен `persistent: true` без кеша.
- **Версии:** Node ≥ 20 (`.nvmrc`).

### Слои

- `apps/web` — **Next.js App Router**, Tailwind CSS + shadcn/ui (компоненты копируются в проект, не устанавливаются как пакет). Алиас `@/*` → `src/*`. `transpilePackages` включает `@expence-tracker/shared-types`.
- `apps/api` — **NestJS**. Точка входа `src/main.ts`, глобальный префикс `/api`. `PrismaModule` помечен `@Global()` — `PrismaService` доступен во всех модулях без явного импорта. Алиас `@/*` → `src/*`.
- `apps/api/prisma/schema.prisma` — единственный источник истины для БД. Provider — postgresql. Модели добавляются здесь, после чего `prisma migrate dev`.

### Shared пакеты

- `@expence-tracker/tsconfig` — три экспортируемых пресета: `base.json` (strict + `noUncheckedIndexedAccess`), `nextjs.json` (jsx, DOM lib, plugin next), `nestjs.json` (CommonJS, decorator-флаги). Apps подключают через `extends`.
- `@expence-tracker/eslint-config` — `base.js`, `next.js`, `nest.js`. Apps подключают через `extends: ["@expence-tracker/eslint-config/<name>"]` в `.eslintrc.cjs`.
- `@expence-tracker/shared-types` — **только чистые TypeScript-типы** (DTO request/response, доменные интерфейсы, enum-ы валют/статусов). Запрещено импортировать сюда `@prisma/client`, NestJS, React. Экспортируется как `src/index.ts` напрямую (без сборки), `transpilePackages`/`tsconfig paths` обеспечивают видимость.

### Frontend: Feature Slice Design (FSD)

Фронтенд (`apps/web`) организован по [Feature Slice Design](https://feature-sliced.design/).

**Слои (от верхнего к нижнему — каждый слой импортирует только из слоёв ниже):**

| Слой | Путь | Содержимое |
|------|------|-----------|
| `app` | `src/app/` | Next.js App Router: только `page.tsx`, `layout.tsx`, Route Handlers |
| `views` | `src/views/` | Server Components страниц, реэкспортируют виджеты (переименовано из `pages/` — Next.js резервирует это имя для Pages Router) |
| `widgets` | `src/widgets/` | Составные UI-блоки (формы, секции) — Client Components |
| `features` | `src/features/` | Бизнес-логика: zod-схемы, API-клиент, хуки |
| `entities` | `src/entities/` | Доменные типы (re-export из shared-types) |
| `shared` | `src/shared/` | UI-компоненты (shadcn), env-конфиг, fetch-хелпер |

**Правила:**
- `app/` содержит только роутинг и Route Handlers — никакой бизнес-логики. Route Handlers могут импортировать из `shared/` (прагматическое исключение FSD — они являются server-side и не имеют аналога в `pages/`).
- Слайс публикует API только через `index.ts` — не импортировать из внутренних путей.
- `shared/ui/` — shadcn/ui компоненты, устанавливаются через `pnpm dlx shadcn@latest add <name>`.
- Новый функциональный блок: добавить feature-слайс в `src/features/<name>/`, виджет в `src/widgets/<name>/`, страницу в `src/views/<name>/`.

### Аутентификация

JWT выдаётся NestJS, фронт хранит его в **httpOnly cookie**. Серверные компоненты Next.js читают cookie и проксируют запросы в API. Стороннего auth-провайдера нет.

### Конфигурация окружения

- Корневой `.env.example` — общие переменные (POSTGRES_*, DATABASE_URL, JWT_*, NEXT_PUBLIC_API_URL).
- `apps/web/.env.example` и `apps/api/.env.example` — узкие копии для локальной разработки конкретного приложения.
- `docker-compose.yml` читает `POSTGRES_USER/PASSWORD/DB/PORT` из `.env`.

## Conventions

- При изменении API сначала правьте контракт в `packages/shared-types/src`, затем используйте тип на обоих концах. Это единственный мост между web и api.
- Prisma migrations пишите через `prisma migrate dev --name <kebab-case>`. Никогда не редактируйте сгенерированные SQL-файлы вручную после применения.
- ESLint и tsconfig **расширяются** из shared-пакетов, а не дублируются. Если нужно правило для всего репо — кладите в `packages/eslint-config/base.js`; правило только для одного приложения — в его `.eslintrc.cjs`.
- Корневой `package.json` помечен `private: true`. Любой новый внутренний пакет именуется `@expence-tracker/<name>` и тоже `private: true`.

## Соглашение о коммитах

Формат: `<type>(<scope>): <description>`

**Типы:**

| Тип | Когда использовать |
|-----|--------------------|
| `feat` | Новая функциональность |
| `fix` | Исправление бага |
| `refactor` | Рефакторинг без изменения поведения |
| `docs` | Документация (CLAUDE.md, комментарии) |
| `chore` | Конфиги, зависимости, CI — без кода продукта |
| `test` | Добавление или правка тестов |
| `perf` | Оптимизация производительности |

**Scopes:** `api`, `web`, `shared-types`, `prisma`, `docker` — имя пакета или слоя.

**Правила:**
- `description` — в нижнем регистре, без точки в конце, на английском языке.
- Тело коммита (через пустую строку) — объясняет **почему**, если причина неочевидна из заголовка.
- Один коммит = одна логическая единица изменений. Не смешивать feat и refactor в одном коммите.
- Breaking change: добавить `!` после scope (`feat(api)!:`) и описать в теле.

**Примеры:**
```
feat(api): add TransactionModule with CQRS and monthly aggregation
fix(web): validate JWT before dashboard redirect
refactor(web): rename FSD layer pages → views
docs: translate CLAUDE.md to Russian
chore: expand Claude Code allowed commands in local settings
```

## Работа с ветками (GitHub Flow)

**Базовая ветка:** `master` (защищена — прямые пуши запрещены).

**Жизненный цикл ветки:**

1. Синхронизироваться с базовой: `git pull origin master`
2. Создать ветку: `git checkout -b <type>/<description>`
3. Коммитить и пушить итеративно.
4. Открыть PR → `master` при готовности к ревью.
5. После мёрджа удалить ветку: `git branch -d <branch>`.

**Именование веток:** `<type>/<kebab-case-description>`

Типы зеркалят типы коммитов:

| Префикс | Когда использовать |
|---------|-------------------|
| `feat/` | Новая функциональность |
| `fix/` | Исправление бага |
| `refactor/` | Рефакторинг без изменения поведения |
| `chore/` | Конфиги, зависимости |
| `docs/` | Документация |

**Правила:**
- Ветки создаются только от `master` — не от других feature-веток.
- Один PR = одна логическая единица изменений.
- Мёрдж только через PR с ревью; никакого `git push origin master` напрямую.
- Ветка живёт пока открыт PR; после мёрджа — удалить локально и удалённо.
- Называть ветки на английском в kebab-case: `feat/home-screen`, `fix/auth-redirect`.

## Что отложено

- Тестовый стек на фронте (Vitest или Jest) — выбрать при добавлении первых тестов.
- `packages/ui` — пока не нужен, всё в `apps/web`.
- CI и production deployment — после первого рабочего билда.
- Доменные модели Prisma (User, Expense, Category) — отдельная итерация.
