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
