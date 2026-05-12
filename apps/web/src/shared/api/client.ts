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
