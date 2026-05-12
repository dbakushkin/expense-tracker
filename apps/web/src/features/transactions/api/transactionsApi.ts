import type { TransactionListResponse } from '@/entities/transaction';

interface ListParams {
  page?: number;
  limit?: number;
}

export const transactionsApi = {
  async list(params: ListParams = {}): Promise<TransactionListResponse> {
    const search = new URLSearchParams();
    if (params.page != null) search.set('page', String(params.page));
    if (params.limit != null) search.set('limit', String(params.limit));

    const qs = search.toString();
    const url = qs ? `/api/transactions?${qs}` : '/api/transactions';

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { message?: string | string[] };
      const raw = data.message;
      const message = Array.isArray(raw) ? raw[0] : (raw ?? res.statusText);
      throw Object.assign(new Error(message), { status: res.status });
    }
    return res.json() as Promise<TransactionListResponse>;
  },
};
