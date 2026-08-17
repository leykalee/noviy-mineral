import type { Metadata } from 'next';
import Link from 'next/link';
import { AccountShell } from '@/components/account/AccountShell';
import { Icon } from '@/components/common/Icon';
import { accountNav } from '@/config/navigation';

export const metadata: Metadata = {
  title: 'Личный кабинет',
  robots: { index: false, follow: false },
};

/**
 * Главная кабинета (п.41 ТЗ): без бессмысленной статистики,
 * основная ценность — быстро попасть в заказы.
 */
export default function AccountPage() {
  return (
    <div className="container-page pb-16 pt-10">
      <AccountShell title="Личный кабинет">
        <ul className="grid gap-3 sm:grid-cols-2">
          {accountNav.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border p-5 text-[17px] font-medium transition-colors duration-[var(--dur-fast)] hover:border-brand hover:text-brand"
              >
                {link.label}
                <Icon name="arrow-right" size={20} />
              </Link>
            </li>
          ))}
        </ul>
      </AccountShell>
    </div>
  );
}
