import type { CategoryPublic } from '@/entities/category';

export const categoriesApi = {
  async list(): Promise<CategoryPublic[]> {
    const res = await fetch('/api/categories', { cache: 'no-store' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { message?: string | string[] };
      const raw = data.message;
      const message = Array.isArray(raw) ? raw[0] : (raw ?? res.statusText);
      throw Object.assign(new Error(message), { status: res.status });
    }
    return res.json() as Promise<CategoryPublic[]>;
  },
};
