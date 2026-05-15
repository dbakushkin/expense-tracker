export type TransactionType = 'income' | 'expense';

export interface TransactionPublic {
  id: string;
  amount: string;            // Decimal → string
  type: TransactionType;
  description: string | null;
  date: string;              // ISO
  categoryId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionSummary {
  income: string;
  expense: string;
  balance: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TransactionListResponse {
  items: TransactionPublic[];
  summary: TransactionSummary;
  meta: PaginationMeta;
}

export interface CreateTransactionRequest {
  amount: number;
  type: TransactionType;
  description?: string;
  date: string;              // ISO
  categoryId?: string | null;
}

export interface UpdateTransactionRequest {
  amount?: number;
  type?: TransactionType;
  description?: string | null;
  date?: string;
  categoryId?: string | null;
}

export interface ListTransactionsQueryParams {
  month?: number;            // 1..12
  year?: number;             // 2000..2100
  page?: number;             // >= 1
  limit?: number;            // 1..100
}
