# Auth Pages Design

**Date:** 2026-05-12
**Scope:** Страницы логина и регистрации для `apps/web`, архитектура Feature Slice Design.

---

## Контекст

- API авторизации готов: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- Shared-типы определены: `RegisterRequest`, `LoginRequest`, `AuthResponse`, `UserPublic`
- Фронтенд — Next.js 14 App Router, Tailwind CSS, shadcn/ui
- JWT хранится в httpOnly cookie, выставляется через Next.js Route Handler

---

## Архитектура: FSD + Next.js App Router

Используется Вариант A («тонкая маршрутизация»): `app/` содержит только файлы роутинга и Route Handlers, вся бизнес-логика и UI живут в FSD-слоях.

### Структура директорий

```
apps/web/src/
├── app/                              # Next.js App Router (только роутинг)
│   ├── (auth)/
│   │   ├── login/page.tsx            # импортирует LoginPage
│   │   └── register/page.tsx         # импортирует RegisterPage
│   ├── (protected)/
│   │   └── dashboard/page.tsx        # импортирует DashboardPage
│   ├── api/auth/
│   │   ├── login/route.ts            # Route Handler → cookie
│   │   ├── register/route.ts         # Route Handler → cookie
│   │   └── logout/route.ts           # Route Handler → удаляет cookie
│   ├── layout.tsx
│   └── globals.css
│
├── pages/                            # FSD: Page layer
│   ├── login/ui/LoginPage.tsx
│   ├── register/ui/RegisterPage.tsx
│   └── dashboard/ui/DashboardPage.tsx
│
├── widgets/                          # FSD: Widget layer
│   └── auth-form/ui/
│       ├── LoginForm.tsx
│       └── RegisterForm.tsx
│
├── features/                         # FSD: Feature layer
│   └── auth/
│       ├── model/
│       │   ├── login.schema.ts
│       │   └── register.schema.ts
│       ├── api/authApi.ts
│       └── index.ts
│
├── entities/                         # FSD: Entity layer
│   └── user/
│       ├── model/user.types.ts       # re-export из shared-types
│       └── index.ts
│
└── shared/                           # FSD: Shared layer
    ├── api/client.ts                 # базовый fetch-wrapper
    ├── ui/                           # shadcn/ui компоненты
    └── config/env.ts                 # env-переменные
```

---

## Поток авторизации

### Вход / Регистрация

1. Пользователь заполняет форму (Client Component)
2. `authApi.login()` / `authApi.register()` делает `POST /api/auth/login` на Next.js Route Handler
3. Route Handler проксирует запрос в NestJS (`http://localhost:3001/api/auth/...`)
4. NestJS возвращает `{ user, accessToken }`
5. Route Handler ставит httpOnly cookie: `access_token=<jwt>` и возвращает клиенту `{ user }`
6. Клиент выполняет `router.push('/dashboard')`

### Cookie-параметры

| Параметр   | Значение                                        |
|------------|------------------------------------------------|
| Name       | `access_token`                                 |
| HttpOnly   | true                                           |
| SameSite   | Lax                                            |
| Secure     | true (только в production)                     |
| Path       | /                                              |
| Max-Age    | соответствует `JWT_EXPIRES_IN` из env          |

### Защищённые страницы (`/dashboard`)

- Server Component читает `cookies().get('access_token')`
- Делает `GET http://localhost:3001/api/auth/me` с заголовком `Authorization: Bearer <token>`
- `200` → рендерит страницу
- `401` → `redirect('/login')`

### Auth-страницы при наличии сессии

- Server Component проверяет наличие cookie
- Если токен есть → `redirect('/dashboard')`
- Если нет → рендерит форму

### Выход

- Кнопка Logout вызывает `POST /api/auth/logout`
- Route Handler удаляет cookie `access_token`
- Redirect на `/login`

---

## Компоненты

### Zod-схемы (`features/auth/model/`)

```ts
// login.schema.ts
{ email: z.string().email(), password: z.string().min(1) }

// register.schema.ts — зеркалит RegisterDto
{ email: z.string().email(), name: z.string().min(2).max(100),
  password: z.string().min(8).max(72) }
```

### Виджеты форм (`widgets/auth-form/ui/`)

`LoginForm` и `RegisterForm` — Client Components (`"use client"`):
- `react-hook-form` + `zodResolver` для управления состоянием и валидацией
- Клиентские ошибки — под полем при blur/submit
- Серверные ошибки (401, 409 и т.д.) — `<Alert>` над кнопкой Submit

### shadcn/ui компоненты

`Button`, `Input`, `Label`, `Form`, `Card`, `CardHeader`, `CardContent`, `Alert`

### Страницы (`pages/*/ui/`)

- Центрируют форму: `flex min-h-screen items-center justify-center`
- Ссылка-переключатель: `/login` → «Нет аккаунта? Зарегистрироваться», `/register` → «Уже есть аккаунт? Войти»

### Dashboard-заглушка

Server Component. Получает `UserPublic`, показывает `Привет, {user.name}` и кнопку Logout.

---

## Зависимости к установке

```
react-hook-form
@hookform/resolvers
zod
```

Shadcn/ui компоненты устанавливаются через CLI: `npx shadcn@latest add button input label form card alert`

---

## CLAUDE.md

В CLAUDE.md добавить раздел о FSD-архитектуре фронтенда.
