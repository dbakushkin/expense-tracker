import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { nestFetch } from '@/shared/api/client';

export default async function HomePage() {
  const token = cookies().get('access_token')?.value;
  if (token) {
    const res = await nestFetch('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    redirect(res.ok ? '/dashboard' : '/login');
  }
  redirect('/login');
}
