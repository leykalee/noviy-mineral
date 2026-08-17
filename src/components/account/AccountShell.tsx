'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { AuthForm } from '@/components/account/AuthForm';
import { Icon } from '@/components/common/Icon';
import { useStore } from '@/components/store/StoreProvider';
import { accountNav } from '@/config/navigation';
import { cx } from '@/lib/cx';

/**
 * Каркас личного кабинета: боковая навигация + содержимое раздела.
 * Неавторизованному показываем форму входа вместо разделов.
 */
export function AccountShell({ title, children }: { title: string; children: ReactNode }) {
  const { user, logout, hydrated } = useStore();
  const pathname = usePathname();

  if (!hydrated) {
    return <div className="skeleton h-72 rounded-[var(--radius-md)]" />;
  }

  if (!user) {
    return (
      <>
        <h1 className="mb-2 text-center text-[28px] font-semibold tracking-[-0.015em]">
          Личный кабинет
        </h1>
        <p className="mx-auto mb-8 max-w-[46ch] text-center text-[15px] text-muted-foreground">
          Войдите, чтобы видеть заказы и хранить избранное между устройствами. Покупать можно и без
          регистрации.
        </p>
        <AuthForm />
      </>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold tracking-[-0.015em]">{title}</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-border-strong px-4 text-[15px] transition-colors duration-[var(--dur-fast)] hover:border-brand hover:text-brand"
        >
          Выйти
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        <nav aria-label="Разделы кабинета">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible scroll-thin">
            {accountNav.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={cx(
                      'inline-flex h-11 shrink-0 items-center gap-2 rounded-[var(--radius-sm)] px-3.5 text-[15px] transition-colors duration-[var(--dur-fast)] lg:w-full',
                      active
                        ? 'bg-brand-soft font-medium text-brand'
                        : 'text-foreground hover:bg-muted',
                    )}
                  >
                    {link.label}
                    <Icon name="chevron-right" size={16} className="ml-auto hidden opacity-50 lg:block" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
