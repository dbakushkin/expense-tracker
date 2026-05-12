import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { nestFetch } from '@/shared/api/client';
import { RegisterForm } from '@/widgets/auth-form';

export async function RegisterPage() {
  const token = cookies().get('access_token')?.value;
  if (token) {
    const res = await nestFetch('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <RegisterForm />
    </main>
  );
}
