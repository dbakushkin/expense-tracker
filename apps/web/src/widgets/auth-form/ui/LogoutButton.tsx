'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { authApi } from '@/features/auth';

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await authApi.logout();
    } finally {
      router.push('/login');
    }
  }

  return (
    <Button variant="outline" onClick={handleLogout} disabled={loading}>
      {loading ? 'Выход...' : 'Выйти'}
    </Button>
  );
}
