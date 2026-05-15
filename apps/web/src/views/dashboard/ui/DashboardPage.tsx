import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { nestFetch } from '@/shared/api/client';
import { PAGE_SIZE } from '@/shared/config/pagination';
import { AppHeader } from '@/widgets/app-header';
import { RecentTransactions } from '@/widgets/recent-transactions';
import { CreateTransactionDialog } from '@/widgets/transaction-form';
import type { UserPublic } from '@/entities/user';
import type { TransactionListResponse } from '@/entities/transaction';
import type { CategoryPublic } from '@/entities/category';

interface DashboardPageProps {
  searchParams?: { page?: string };
}

export async function DashboardPage({ searchParams }: DashboardPageProps) {
  const token = cookies().get('access_token')?.value;
  if (!token) redirect('/login');

  const requestedPage = Number(searchParams?.page ?? '1');
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  const auth = { Authorization: `Bearer ${token}` };

  const [userRes, listRes, categoriesRes] = await Promise.all([
    nestFetch('/auth/me', { headers: auth, cache: 'no-store' }),
    nestFetch(`/transactions?page=${page}&limit=${PAGE_SIZE}`, { headers: auth, cache: 'no-store' }),
    nestFetch('/categories', { headers: auth, cache: 'no-store' }),
  ]);

  if (userRes.status === 401 || userRes.status === 403 || listRes.status === 401 || listRes.status === 403) {
    redirect('/login');
  }

  if (!userRes.ok || !listRes.ok) {
    throw new Error('Failed to load dashboard data');
  }

  const user = await userRes.json() as UserPublic;
  const list = await listRes.json() as TransactionListResponse;
  const categories = categoriesRes.ok ? await categoriesRes.json() as CategoryPublic[] : [];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} />
      <main className="container mx-auto space-y-6 px-4 py-8">
        <section className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Привет, {user.name}!</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <CreateTransactionDialog />
        </section>
        <RecentTransactions initialData={list} categories={categories} />
      </main>
    </div>
  );
}
