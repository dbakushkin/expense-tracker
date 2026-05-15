'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { transactionsApi } from '@/features/transactions';
import type { TransactionListResponse } from '@/entities/transaction';
import type { CategoryPublic } from '@/entities/category';
import { PAGE_SIZE } from '@/shared/config/pagination';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { cn } from '@/shared/lib/utils';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { PaginationControls } from './PaginationControls';

interface RecentTransactionsProps {
  initialData: TransactionListResponse;
  categories: CategoryPublic[];
}

export function RecentTransactions({ initialData, categories }: RecentTransactionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const urlPage = Number(searchParams.get('page') ?? '1') || 1;

  const [data, setData] = useState<TransactionListResponse>(initialData);
  const [loading, setLoading] = useState(false);
  const lastFetchedPageRef = useRef<number>(initialData.meta.page);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (urlPage === lastFetchedPageRef.current) return;
    lastFetchedPageRef.current = urlPage;
    let cancelled = false;
    setLoading(true);
    transactionsApi
      .list({ page: urlPage, limit: PAGE_SIZE })
      .then((next) => {
        if (!cancelled) setData(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [urlPage]);

  function handlePageChange(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) {
      params.delete('page');
    } else {
      params.set('page', String(nextPage));
    }
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  const { items, meta } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Последние транзакции</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Описание</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead className="text-right">Сумма</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Транзакций пока нет
                </TableCell>
              </TableRow>
            ) : (
              items.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(tx.date)}</TableCell>
                  <TableCell>{tx.description ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {tx.categoryId ? (categoryMap.get(tx.categoryId)?.name ?? '—') : '—'}
                  </TableCell>
                  <TableCell>
                    <span className={cn('text-xs font-medium', tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600')}>
                      {tx.type === 'income' ? 'Доход' : 'Расход'}
                    </span>
                  </TableCell>
                  <TableCell className={cn('text-right tabular-nums', tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600')}>
                    {tx.type === 'income' ? '+' : '−'}{formatCurrency(tx.amount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <PaginationControls
          page={meta.page}
          totalPages={meta.totalPages}
          disabled={loading}
          onPageChange={handlePageChange}
        />
      </CardContent>
    </Card>
  );
}
