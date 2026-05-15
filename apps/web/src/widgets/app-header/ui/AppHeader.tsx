'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet } from 'lucide-react';
import type { UserPublic } from '@/entities/user';
import { cn } from '@/shared/lib/utils';
import { ProfileMenu } from './ProfileMenu';

interface AppHeaderProps {
  user: UserPublic;
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'Главная' },
  { href: '/transactions', label: 'Транзакции' },
  { href: '/categories', label: 'Категории' },
] as const;

export function AppHeader({ user }: AppHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 items-center gap-6 px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Wallet className="h-5 w-5" aria-hidden />
          <span>ExpenseTracker</span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto">
          <ProfileMenu user={user} />
        </div>
      </div>
    </header>
  );
}
