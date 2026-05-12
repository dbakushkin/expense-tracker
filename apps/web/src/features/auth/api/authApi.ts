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
