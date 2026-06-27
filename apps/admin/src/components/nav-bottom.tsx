// src/components/nav-bottom.tsx
'use client';

import { cn } from '@/lib/utils';
import { useLogout } from '@/hooks/swr/api-client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CreditCardIcon, GiftIcon, PlantIcon, SignOutIcon, UsersIcon } from '@phosphor-icons/react';

const navItems = [
  { href: '/customers', icon: UsersIcon, labelKey: 'customers' as const },
  { href: '/leads', icon: PlantIcon, labelKey: 'leads' as const },
  { href: '/subscriptions', icon: CreditCardIcon, labelKey: 'subscriptions' as const },
  { href: '/referral-codes', icon: GiftIcon, labelKey: 'referralCodes' as const },
];

export function NavBottom() {
  const pathname = usePathname();
  const t = useTranslations('NavBottom');
  const logout = useLogout();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    toast.success(t('logoutSuccess'));
    router.push('/auth/signin');
  };

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 h-14 border-t border-gray-200/50 bg-white shadow-lg md:hidden">
      <div className="flex h-full items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5"
            >
              <item.icon
                weight={isActive ? 'duotone' : 'regular'}
                size={26}
                className={cn(isActive ? 'text-primary' : 'text-muted-foreground')}
              />
              <span
                className={cn('text-[10px]', isActive ? 'text-primary' : 'text-muted-foreground')}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}

        <button
          onClick={handleLogout}
          className="flex cursor-pointer flex-col items-center justify-center gap-0.5"
        >
          <SignOutIcon weight="regular" size={26} className="text-muted-foreground" />
          <span className="text-muted-foreground text-[10px]">{t('logout')}</span>
        </button>
      </div>
    </nav>
  );
}
