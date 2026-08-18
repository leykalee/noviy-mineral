'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { primaryNav } from '@/config/navigation';
import { cx } from '@/lib/cx';

/**
 * Основная навигация шапки с подсветкой текущего раздела.
 *
 * Активным считается не только точное совпадение: страница товара из акций
 * или вложенный маршрут раздела тоже подсвечивают свой пункт.
 */
export function PrimaryNav() {
  const pathname = usePathname();

  return (
    <ul className="ml-2 flex items-center gap-1">
      {primaryNav.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'inline-flex h-10 items-center rounded-[var(--radius-sm)] px-3.5 text-[15px] transition-colors duration-[var(--dur-fast)]',
                active
                  ? 'bg-brand-soft font-medium text-brand'
                  : 'text-foreground hover:bg-brand-soft hover:text-brand',
              )}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
