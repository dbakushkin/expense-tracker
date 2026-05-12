'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { authApi } from '@/features/auth';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await authApi.logout();
    router.push('/login');
  }

  return (
    <Button variant="outline" onClick={handleLogout}>
      Выйти
    </Button>
  );
}
