import type { CreateTransactionRequest } from '@expence-tracker/shared-types';
import type { TransactionListResponse, TransactionPublic } from '@/entities/transaction';

interface ListParams {
  page?: number;
  limit?: number;
}

async function send<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { message?: string | string[] };
    const raw = data.message;
    const message = Array.isArray(raw) ? raw[0] : (raw ?? res.statusText);
    throw Object.assign(new Error(message), { status: res.status });
  }
  return res.json() as Promise<T>;
}

export const transactionsApi = {
  list(params: ListParams = {}): Promise<TransactionListResponse> {
    const search = new URLSearchParams();
    if (params.page != null) search.set('page', String(params.page));
    if (params.limit != null) search.set('limit', String(params.limit));
    const qs = search.toString();
    const url = qs ? `/api/transactions?${qs}` : '/api/transactions';
    return send<TransactionListResponse>(url);
  },

  create(data: CreateTransactionRequest): Promise<TransactionPublic> {
    return send<TransactionPublic>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
