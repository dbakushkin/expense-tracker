# Auth Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать страницы логина и регистрации в `apps/web` с использованием Feature Slice Design (FSD), JWT-авторизации через httpOnly cookie и shadcn/ui.

**Architecture:** Вариант A (тонкая маршрутизация) — `app/` содержит только роутинг-файлы Next.js и Route Handlers; вся бизнес-логика и UI живут в FSD-слоях (`pages/`, `widgets/`, `features/`, `entities/`, `shared/`). Route Handlers проксируют запросы с клиента в NestJS и ставят JWT как httpOnly cookie. Dashboard — Server Component, который читает cookie и вызывает `GET /api/auth/me` на NestJS. Страницы логина/регистрации проверяют JWT через `/auth/me` перед редиректом, чтобы избежать петли при просроченном токене.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, shadcn/ui, react-hook-form, @hookform/resolvers, zod, Vitest

---

## File Map

| Файл | Действие | Ответственность |
|------|----------|-----------------|
| `apps/web/vitest.config.ts` | Создать | Конфигурация Vitest |
| `apps/web/components.json` | Создать | Конфигурация shadcn/ui |
| `apps/web/tailwind.config.ts` | Изменить | CSS-переменные + FSD content paths |
| `apps/web/src/app/globals.css` | Изменить | CSS-переменные shadcn/ui |
| `apps/web/src/shared/config/env.ts` | Создать | Серверные env-переменные |
| `apps/web/src/shared/api/client.ts` | Создать | Fetch-хелпер для вызовов NestJS |
| `apps/web/src/shared/lib/utils.ts` | Создать | Tailwind class merge (создаётся shadcn CLI) |
| `apps/web/src/shared/ui/` | Создать | shadcn/ui компоненты (CLI) |
| `apps/web/src/entities/user/model/user.types.ts` | Создать | Re-export `UserPublic` из shared-types |
| `apps/web/src/entities/user/index.ts` | Создать | Public API entity |
| `apps/web/src/features/auth/model/login.schema.ts` | Создать | Zod-схема формы логина |
| `apps/web/src/features/auth/model/register.schema.ts` | Создать | Zod-схема формы регистрации |
| `apps/web/src/features/auth/model/__tests__/login.schema.test.ts` | Создать | Тесты login-схемы |
| `apps/web/src/features/auth/model/__tests__/register.schema.test.ts` | Создать | Тесты register-схемы |
| `apps/web/src/features/auth/api/authApi.ts` | Создать | Fetch к Next.js Route Handlers |
| `apps/web/src/features/auth/api/__tests__/authApi.test.ts` | Создать | Тесты authApi |
| `apps/web/src/features/auth/index.ts` | Создать | Public API feature |
| `apps/web/src/widgets/auth-form/ui/LoginForm.tsx` | Создать | Форма логина (Client Component) |
| `apps/web/src/widgets/auth-form/ui/RegisterForm.tsx` | Создать | Форма регистрации (Client Component) |
| `apps/web/src/widgets/auth-form/ui/LogoutButton.tsx` | Создать | Кнопка выхода (Client Component) |
| `apps/web/src/widgets/auth-form/index.ts` | Создать | Public API widget |
| `apps/web/src/pages/login/ui/LoginPage.tsx` | Создать | Страница логина (Server Component) |
| `apps/web/src/pages/login/index.ts` | Создать | Public API page |
| `apps/web/src/pages/register/ui/RegisterPage.tsx` | Создать | Страница регистрации (Server Component) |
| `apps/web/src/pages/register/index.ts` | Создать | Public API page |
| `apps/web/src/pages/dashboard/ui/DashboardPage.tsx` | Создать | Dashboard-заглушка (Server Component) |
| `apps/web/src/pages/dashboard/index.ts` | Создать | Public API page |
| `apps/web/src/app/(auth)/login/page.tsx` | Создать | Next.js роутинг → `/login` |
| `apps/web/src/app/(auth)/register/page.tsx` | Создать | Next.js роутинг → `/register` |
| `apps/web/src/app/(protected)/dashboard/page.tsx` | Создать | Next.js роутинг → `/dashboard` |
| `apps/web/src/app/api/auth/login/route.ts` | Создать | Route Handler: проксирует логин, ставит cookie |
| `apps/web/src/app/api/auth/register/route.ts` | Создать | Route Handler: проксирует регистрацию, ставит cookie |
| `apps/web/src/app/api/auth/logout/route.ts` | Создать | Route Handler: удаляет cookie |
| `apps/web/src/app/page.tsx` | Изменить | Редирект на /login или /dashboard |
| `apps/web/package.json` | Изменить | Добавить зависимости + test-скрипты |
| `CLAUDE.md` | Изменить | Добавить раздел FSD-архитектуры |

---

### Task 1: Установить зависимости и настроить Vitest

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/vitest.config.ts`

- [ ] **Step 1: Установить production-зависимости**

```bash
pnpm --filter @expence-tracker/web add react-hook-form @hookform/resolvers zod
```

Expected: пакеты добавлены в `apps/web/package.json` → `dependencies`

- [ ] **Step 2: Установить dev-зависимости**

```bash
pnpm --filter @expence-tracker/web add -D vitest
```

Expected: `vitest` добавлен в `devDependencies`

- [ ] **Step 3: Создать `apps/web/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 4: Добавить test-скрипты в `apps/web/package.json`**

В секцию `"scripts"` добавить:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Убедиться, что тесты запускаются**

```bash
pnpm --filter @expence-tracker/web test
```

Expected: `No test files found, exiting with code 0` (или аналогичное — не ошибка)

- [ ] **Step 6: Коммит**

```bash
git add apps/web/package.json apps/web/vitest.config.ts pnpm-lock.yaml
git commit -m "feat(web): add react-hook-form, zod, vitest"
```

---

### Task 2: Настроить shadcn/ui

**Files:**
- Create: `apps/web/components.json`
- Modify: `apps/web/tailwind.config.ts`
- Modify: `apps/web/src/app/globals.css`
- Create: `apps/web/src/shared/lib/utils.ts` (создаётся CLI)
- Create: `apps/web/src/shared/ui/` (создаётся CLI)

- [ ] **Step 1: Обновить `apps/web/tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/pages/**/*.{ts,tsx}",
    "./src/widgets/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
    "./src/entities/**/*.{ts,tsx}",
    "./src/shared/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 2: Заменить содержимое `apps/web/src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 3: Создать `apps/web/components.json`**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/shared/ui",
    "utils": "@/shared/lib/utils"
  }
}
```

- [ ] **Step 4: Установить shadcn/ui компоненты**

```bash
cd apps/web && pnpm dlx shadcn@latest add button input label form card alert
```

Ответить `yes` на все вопросы. CLI создаст файлы в `src/shared/ui/` и `src/shared/lib/utils.ts`.

Expected:
```
✓ Writing apps/web/src/shared/ui/button.tsx
✓ Writing apps/web/src/shared/ui/input.tsx
✓ Writing apps/web/src/shared/ui/label.tsx
✓ Writing apps/web/src/shared/ui/form.tsx
✓ Writing apps/web/src/shared/ui/card.tsx
✓ Writing apps/web/src/shared/ui/alert.tsx
✓ Writing apps/web/src/shared/lib/utils.ts
```

- [ ] **Step 5: Проверить, что файлы существуют**

```bash
ls apps/web/src/shared/ui/ && ls apps/web/src/shared/lib/
```

Expected: файлы `button.tsx`, `input.tsx`, `label.tsx`, `form.tsx`, `card.tsx`, `alert.tsx` и `utils.ts`

- [ ] **Step 6: Коммит**

```bash
git add apps/web/components.json apps/web/tailwind.config.ts apps/web/src/app/globals.css apps/web/src/shared/ apps/web/package.json apps/web/pnpm-lock.yaml
git commit -m "feat(web): configure shadcn/ui with FSD layout"
```

---

### Task 3: Shared layer — env-конфиг и NestJS-клиент

**Files:**
- Create: `apps/web/src/shared/config/env.ts`
- Create: `apps/web/src/shared/api/client.ts`

- [ ] **Step 1: Создать `apps/web/src/shared/config/env.ts`**

```ts
export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
} as const;
```

- [ ] **Step 2: Создать `apps/web/src/shared/api/client.ts`**

```ts
import { env } from '@/shared/config/env';

export async function nestFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
}
```

- [ ] **Step 3: Коммит**

```bash
git add apps/web/src/shared/config/ apps/web/src/shared/api/
git commit -m "feat(web): add shared env config and NestJS fetch client"
```

---

### Task 4: Entity layer — User

**Files:**
- Create: `apps/web/src/entities/user/model/user.types.ts`
- Create: `apps/web/src/entities/user/index.ts`

- [ ] **Step 1: Создать `apps/web/src/entities/user/model/user.types.ts`**

```ts
export type { UserPublic } from '@expence-tracker/shared-types';
```

- [ ] **Step 2: Создать `apps/web/src/entities/user/index.ts`**

```ts
export type { UserPublic } from './model/user.types';
```

- [ ] **Step 3: Коммит**

```bash
git add apps/web/src/entities/
git commit -m "feat(web): add user entity layer"
```

---

### Task 5: Feature layer — Zod-схемы (TDD)

**Files:**
- Create: `apps/web/src/features/auth/model/__tests__/login.schema.test.ts`
- Create: `apps/web/src/features/auth/model/login.schema.ts`
- Create: `apps/web/src/features/auth/model/__tests__/register.schema.test.ts`
- Create: `apps/web/src/features/auth/model/register.schema.ts`

- [ ] **Step 1: Написать падающие тесты для login-схемы**

Создать `apps/web/src/features/auth/model/__tests__/login.schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { loginSchema } from '../login.schema';

describe('loginSchema', () => {
  it('принимает корректные данные', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'secret' });
    expect(result.success).toBe(true);
  });

  it('отклоняет некорректный email', () => {
    const result = loginSchema.safeParse({ email: 'not-email', password: 'secret' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe('email');
  });

  it('отклоняет пустой пароль', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe('password');
  });
});
```

- [ ] **Step 2: Запустить — убедиться, что падает**

```bash
pnpm --filter @expence-tracker/web test
```

Expected: `FAIL — Cannot find module '../login.schema'`

- [ ] **Step 3: Создать `apps/web/src/features/auth/model/login.schema.ts`**

```ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
```

- [ ] **Step 4: Написать падающие тесты для register-схемы**

Создать `apps/web/src/features/auth/model/__tests__/register.schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { registerSchema } from '../register.schema';

describe('registerSchema', () => {
  it('принимает корректные данные', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      name: 'Иван',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('отклоняет имя короче 2 символов', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      name: 'И',
      password: 'password123',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe('name');
  });

  it('отклоняет пароль короче 8 символов', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      name: 'Иван',
      password: 'short',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe('password');
  });

  it('отклоняет пароль длиннее 72 символов', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      name: 'Иван',
      password: 'a'.repeat(73),
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe('password');
  });
});
```

- [ ] **Step 5: Создать `apps/web/src/features/auth/model/register.schema.ts`**

```ts
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  name: z.string().min(2, 'Минимум 2 символа').max(100, 'Максимум 100 символов'),
  password: z.string().min(8, 'Минимум 8 символов').max(72, 'Максимум 72 символа'),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
```

- [ ] **Step 6: Запустить — убедиться, что все 7 тестов проходят**

```bash
pnpm --filter @expence-tracker/web test
```

Expected: `7 passed`

- [ ] **Step 7: Коммит**

```bash
git add apps/web/src/features/
git commit -m "feat(web): add auth Zod schemas with tests"
```

---

### Task 6: Feature layer — authApi (TDD)

**Files:**
- Create: `apps/web/src/features/auth/api/__tests__/authApi.test.ts`
- Create: `apps/web/src/features/auth/api/authApi.ts`
- Create: `apps/web/src/features/auth/index.ts`

- [ ] **Step 1: Написать падающие тесты для authApi**

Создать `apps/web/src/features/auth/api/__tests__/authApi.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('authApi', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('login', () => {
    it('делает POST /api/auth/login и возвращает user при успехе', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        name: 'User',
        createdAt: '',
        updatedAt: '',
      };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ user: mockUser }), { status: 200 }),
      );

      const { authApi } = await import('../authApi');
      const result = await authApi.login({ email: 'user@example.com', password: 'pass' });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'user@example.com', password: 'pass' }),
        }),
      );
      expect(result).toEqual({ user: mockUser });
    });

    it('бросает ошибку со status 401 при неверных данных', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Invalid credentials' }), { status: 401 }),
      );

      const { authApi } = await import('../authApi');
      await expect(
        authApi.login({ email: 'user@example.com', password: 'wrong' }),
      ).rejects.toMatchObject({ message: 'Invalid credentials', status: 401 });
    });
  });

  describe('register', () => {
    it('делает POST /api/auth/register и возвращает user при успехе', async () => {
      const mockUser = {
        id: '2',
        email: 'new@example.com',
        name: 'Новый',
        createdAt: '',
        updatedAt: '',
      };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ user: mockUser }), { status: 201 }),
      );

      const { authApi } = await import('../authApi');
      const result = await authApi.register({
        email: 'new@example.com',
        name: 'Новый',
        password: 'password1',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/register',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(result).toEqual({ user: mockUser });
    });

    it('бросает ошибку со status 409 при дублирующем email', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Email already in use' }), { status: 409 }),
      );

      const { authApi } = await import('../authApi');
      await expect(
        authApi.register({
          email: 'dup@example.com',
          name: 'User',
          password: 'password1',
        }),
      ).rejects.toMatchObject({ status: 409 });
    });
  });

  describe('logout', () => {
    it('делает POST /api/auth/logout', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );

      const { authApi } = await import('../authApi');
      await authApi.logout();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/logout',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });
});
```

- [ ] **Step 2: Запустить — убедиться, что падает**

```bash
pnpm --filter @expence-tracker/web test
```

Expected: `FAIL — Cannot find module '../authApi'`

- [ ] **Step 3: Создать `apps/web/src/features/auth/api/authApi.ts`**

```ts
import type { LoginRequest, RegisterRequest } from '@expence-tracker/shared-types';
import type { UserPublic } from '@/entities/user';

async function authFetch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { message?: string | string[] };
    const raw = data.message;
    const message = Array.isArray(raw) ? raw[0] : (raw ?? res.statusText);
    throw Object.assign(new Error(message), { status: res.status });
  }
  return res.json() as Promise<T>;
}

export const authApi = {
  login: (data: LoginRequest) =>
    authFetch<{ user: UserPublic }>('/api/auth/login', data),

  register: (data: RegisterRequest) =>
    authFetch<{ user: UserPublic }>('/api/auth/register', data),

  logout: (): Promise<void> =>
    fetch('/api/auth/logout', { method: 'POST' }).then(() => undefined),
};
```

- [ ] **Step 4: Создать `apps/web/src/features/auth/index.ts`**

```ts
export { authApi } from './api/authApi';
export { loginSchema } from './model/login.schema';
export type { LoginFormValues } from './model/login.schema';
export { registerSchema } from './model/register.schema';
export type { RegisterFormValues } from './model/register.schema';
```

- [ ] **Step 5: Запустить — убедиться, что все тесты проходят**

```bash
pnpm --filter @expence-tracker/web test
```

Expected: `10 passed` (3 login + 4 register + 3 authApi)

- [ ] **Step 6: Коммит**

```bash
git add apps/web/src/features/auth/
git commit -m "feat(web): add authApi with tests"
```

---

### Task 7: Route Handlers — login, register, logout

**Files:**
- Create: `apps/web/src/app/api/auth/login/route.ts`
- Create: `apps/web/src/app/api/auth/register/route.ts`
- Create: `apps/web/src/app/api/auth/logout/route.ts`

Cookie-параметры: `httpOnly`, `sameSite: lax`, `secure: true` только в production, `path: /`, `maxAge: 604800` (7 дней — соответствует дефолтному `JWT_EXPIRES_IN: '7d'` в NestJS).

- [ ] **Step 1: Создать `apps/web/src/app/api/auth/login/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { nestFetch } from '@/shared/api/client';
import type { AuthResponse } from '@expence-tracker/shared-types';

export async function POST(req: NextRequest) {
  const body = await req.json() as unknown;

  const res = await nestFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  const data = await res.json() as Record<string, unknown>;

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  const { user, accessToken } = data as unknown as AuthResponse;
  const response = NextResponse.json({ user });
  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
```

- [ ] **Step 2: Создать `apps/web/src/app/api/auth/register/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { nestFetch } from '@/shared/api/client';
import type { AuthResponse } from '@expence-tracker/shared-types';

export async function POST(req: NextRequest) {
  const body = await req.json() as unknown;

  const res = await nestFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  const data = await res.json() as Record<string, unknown>;

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  const { user, accessToken } = data as unknown as AuthResponse;
  const response = NextResponse.json({ user }, { status: 201 });
  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
```

- [ ] **Step 3: Создать `apps/web/src/app/api/auth/logout/route.ts`**

```ts
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('access_token');
  return response;
}
```

- [ ] **Step 4: Коммит**

```bash
git add apps/web/src/app/api/
git commit -m "feat(web): add auth Route Handlers with httpOnly cookie"
```

---

### Task 8: Widget — LoginForm

**Files:**
- Create: `apps/web/src/widgets/auth-form/ui/LoginForm.tsx`
- Create: `apps/web/src/widgets/auth-form/index.ts`

- [ ] **Step 1: Создать `apps/web/src/widgets/auth-form/ui/LoginForm.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { loginSchema, type LoginFormValues, authApi } from '@/features/auth';

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      await authApi.login(values);
      router.push('/dashboard');
    } catch (err) {
      const error = err as Error & { status?: number };
      setServerError(
        error.status === 401
          ? 'Неверный email или пароль'
          : 'Произошла ошибка. Попробуйте позже.',
      );
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Вход</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Пароль</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        </Form>
        <p className="text-center text-sm text-muted-foreground">
          Нет аккаунта?{' '}
          <Link href="/register" className="underline underline-offset-4">
            Зарегистрироваться
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Создать `apps/web/src/widgets/auth-form/index.ts`**

```ts
export { LoginForm } from './ui/LoginForm';
```

- [ ] **Step 3: Коммит**

```bash
git add apps/web/src/widgets/
git commit -m "feat(web): add LoginForm widget"
```

---

### Task 9: Widget — RegisterForm и LogoutButton

**Files:**
- Create: `apps/web/src/widgets/auth-form/ui/RegisterForm.tsx`
- Create: `apps/web/src/widgets/auth-form/ui/LogoutButton.tsx`
- Modify: `apps/web/src/widgets/auth-form/index.ts`

- [ ] **Step 1: Создать `apps/web/src/widgets/auth-form/ui/RegisterForm.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { registerSchema, type RegisterFormValues, authApi } from '@/features/auth';

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', name: '', password: '' },
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    try {
      await authApi.register(values);
      router.push('/dashboard');
    } catch (err) {
      const error = err as Error & { status?: number };
      setServerError(
        error.status === 409
          ? 'Этот email уже зарегистрирован'
          : 'Произошла ошибка. Попробуйте позже.',
      );
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Регистрация</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя</FormLabel>
                  <FormControl>
                    <Input placeholder="Иван Иванов" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Пароль</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Минимум 8 символов" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
          </form>
        </Form>
        <p className="text-center text-sm text-muted-foreground">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="underline underline-offset-4">
            Войти
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Создать `apps/web/src/widgets/auth-form/ui/LogoutButton.tsx`**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { authApi } from '@/features/auth';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await authApi.logout();
    router.push('/login');
  }

  return (
    <Button variant="outline" onClick={handleLogout}>
      Выйти
    </Button>
  );
}
```

- [ ] **Step 3: Обновить `apps/web/src/widgets/auth-form/index.ts`**

```ts
export { LoginForm } from './ui/LoginForm';
export { RegisterForm } from './ui/RegisterForm';
export { LogoutButton } from './ui/LogoutButton';
```

- [ ] **Step 4: Коммит**

```bash
git add apps/web/src/widgets/auth-form/
git commit -m "feat(web): add RegisterForm and LogoutButton widgets"
```

---

### Task 10: Page layer — Login и Register

**Files:**
- Create: `apps/web/src/pages/login/ui/LoginPage.tsx`
- Create: `apps/web/src/pages/login/index.ts`
- Create: `apps/web/src/app/(auth)/login/page.tsx`
- Create: `apps/web/src/pages/register/ui/RegisterPage.tsx`
- Create: `apps/web/src/pages/register/index.ts`
- Create: `apps/web/src/app/(auth)/register/page.tsx`

Страницы логина/регистрации — **async** Server Components: проверяют валидность JWT через `/auth/me` перед редиректом. Это предотвращает бесконечный редирект при просроченном токене (cookie есть, но JWT невалиден).

- [ ] **Step 1: Создать `apps/web/src/pages/login/ui/LoginPage.tsx`**

```tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { nestFetch } from '@/shared/api/client';
import { LoginForm } from '@/widgets/auth-form';

export async function LoginPage() {
  const token = cookies().get('access_token')?.value;
  if (token) {
    const res = await nestFetch('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <LoginForm />
    </main>
  );
}
```

- [ ] **Step 2: Создать `apps/web/src/pages/login/index.ts`**

```ts
export { LoginPage } from './ui/LoginPage';
```

- [ ] **Step 3: Создать `apps/web/src/app/(auth)/login/page.tsx`**

```tsx
import { LoginPage } from '@/pages/login';

export default LoginPage;
```

- [ ] **Step 4: Создать `apps/web/src/pages/register/ui/RegisterPage.tsx`**

```tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { nestFetch } from '@/shared/api/client';
import { RegisterForm } from '@/widgets/auth-form';

export async function RegisterPage() {
  const token = cookies().get('access_token')?.value;
  if (token) {
    const res = await nestFetch('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <RegisterForm />
    </main>
  );
}
```

- [ ] **Step 5: Создать `apps/web/src/pages/register/index.ts`**

```ts
export { RegisterPage } from './ui/RegisterPage';
```

- [ ] **Step 6: Создать `apps/web/src/app/(auth)/register/page.tsx`**

```tsx
import { RegisterPage } from '@/pages/register';

export default RegisterPage;
```

- [ ] **Step 7: Коммит**

```bash
git add apps/web/src/pages/login/ apps/web/src/pages/register/ "apps/web/src/app/(auth)/"
git commit -m "feat(web): add Login and Register pages"
```

---

### Task 11: Page layer — Dashboard

**Files:**
- Create: `apps/web/src/pages/dashboard/ui/DashboardPage.tsx`
- Create: `apps/web/src/pages/dashboard/index.ts`
- Create: `apps/web/src/app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Создать `apps/web/src/pages/dashboard/ui/DashboardPage.tsx`**

```tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { nestFetch } from '@/shared/api/client';
import { LogoutButton } from '@/widgets/auth-form';
import type { UserPublic } from '@/entities/user';

export async function DashboardPage() {
  const token = cookies().get('access_token')?.value;
  if (!token) redirect('/login');

  const res = await nestFetch('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) redirect('/login');

  const user = await res.json() as UserPublic;

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Привет, {user.name}!</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <LogoutButton />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Создать `apps/web/src/pages/dashboard/index.ts`**

```ts
export { DashboardPage } from './ui/DashboardPage';
```

- [ ] **Step 3: Создать `apps/web/src/app/(protected)/dashboard/page.tsx`**

```tsx
import { DashboardPage } from '@/pages/dashboard';

export default DashboardPage;
```

- [ ] **Step 4: Коммит**

```bash
git add apps/web/src/pages/dashboard/ "apps/web/src/app/(protected)/"
git commit -m "feat(web): add Dashboard placeholder page"
```

---

### Task 12: Редирект главной страницы и обновление CLAUDE.md

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Заменить `apps/web/src/app/page.tsx`**

```tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function HomePage() {
  const token = cookies().get('access_token');
  redirect(token ? '/dashboard' : '/login');
}
```

- [ ] **Step 2: Добавить раздел FSD в `CLAUDE.md`**

Найти раздел `## Architecture` и добавить после существующего содержимого подраздел:

```markdown
### Frontend: Feature Slice Design (FSD)

Фронтенд (`apps/web`) организован по [Feature Slice Design](https://feature-sliced.design/).

**Слои (от верхнего к нижнему — каждый слой импортирует только из слоёв ниже):**

| Слой | Путь | Содержимое |
|------|------|------------|
| `app` | `src/app/` | Next.js App Router: только `page.tsx`, `layout.tsx`, Route Handlers |
| `pages` | `src/pages/` | Server Components страниц, реэкспортируют виджеты |
| `widgets` | `src/widgets/` | Составные UI-блоки (формы, секции) — Client Components |
| `features` | `src/features/` | Бизнес-логика: zod-схемы, API-клиент, хуки |
| `entities` | `src/entities/` | Доменные типы (re-export из shared-types) |
| `shared` | `src/shared/` | UI-компоненты (shadcn), env-конфиг, fetch-хелпер |

**Правила:**
- `app/` содержит только роутинг и Route Handlers — никакой бизнес-логики.
- Слайс публикует API только через `index.ts` — не импортировать из внутренних путей.
- `shared/ui/` — shadcn/ui компоненты, устанавливаются через `pnpm dlx shadcn@latest add <name>`.
- Новый функциональный блок: добавить feature-слайс в `src/features/<name>/`, виджет в `src/widgets/<name>/`, страницу в `src/pages/<name>/`.
```

- [ ] **Step 3: Коммит**

```bash
git add apps/web/src/app/page.tsx CLAUDE.md
git commit -m "feat(web): redirect / to login/dashboard; document FSD in CLAUDE.md"
```

---

## Self-Review

**Покрытие спеки:**
- ✅ Структура директорий FSD (все слои)
- ✅ Поток авторизации через Route Handlers с httpOnly cookie
- ✅ Защищённые страницы проверяют токен через /auth/me
- ✅ Auth-страницы проверяют JWT-валидность перед редиректом (нет петли при просроченном токене)
- ✅ react-hook-form + zod + серверные ошибки
- ✅ shadcn/ui: Button, Input, Label, Form, Card, Alert
- ✅ Тесты: zod-схемы и authApi покрыты
- ✅ CLAUDE.md обновлён

**Плейсхолдеры:** не найдены.

**Консистентность типов:**
- `authApi` возвращает `{ user: UserPublic }` — LoginForm и RegisterForm используют `await authApi.login(values)` без деструктуризации (значение не нужно — нужен только side effect cookie). ✅
- `nestFetch` используется в: Route Handlers (Tasks 7, 10, 11) и DashboardPage (Task 11). Сигнатура одинакова. ✅
- `LogoutButton` импортирует `authApi` из `@/features/auth` — экспорт есть в Task 6. ✅
