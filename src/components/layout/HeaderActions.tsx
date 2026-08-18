'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '@/components/common/Icon';
import { useStore } from '@/components/store/StoreProvider';
import { cx } from '@/lib/cx';
import { pluralize } from '@/lib/format';

interface ActionProps {
  href: string;
  icon: IconName;
  /** Иконка для активного состояния, если отличается от обычной */
  activeIcon?: IconName;
  label: string;
  count?: number;
  /** Подпись под иконкой на десктопе */
  caption?: string;
  /** Дополнительные разделы, при которых пункт считается активным */
  alsoActiveOn?: string[];
}

function Action({ href, icon, activeIcon, label, count, caption, alsoActiveOn = [] }: ActionProps) {
  const pathname = usePathname();
  const paths = [href, ...alsoActiveOn];
  const active = paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <Link
      href={href}
      aria-label={count ? `${label}, ${count}` : label}
      aria-current={active ? 'page' : undefined}
      // 44 px по высоте держим всегда; по ширине на узких экранах ужимаем,
      // иначе три действия не помещаются рядом с логотипом на 390 px
      className={cx(
        'group relative flex h-11 min-w-10 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-sm)] px-1 py-1.5 transition-colors duration-[var(--dur-fast)] sm:min-w-11 sm:px-2 lg:h-auto',
        active ? 'bg-brand-soft text-brand' : 'text-foreground hover:text-brand',
      )}
    >
      <span className="relative">
        <Icon name={active && activeIcon ? activeIcon : icon} size={22} />
        {count != null && count > 0 && (
          <span
            className={cx(
              'tnum absolute -right-2 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full',
              'bg-brand px-1 text-[11px] font-semibold leading-none text-white',
            )}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </span>
      {caption && (
        <span
          className={cx(
            'hidden text-[11px] lg:block',
            active ? 'font-medium text-brand' : 'text-muted-foreground',
          )}
        >
          {caption}
        </span>
      )}
    </Link>
  );
}

export function HeaderActions() {
  const { cartCount, favoritesCount, user, hydrated } = useStore();

  return (
    <div className="flex items-center gap-1">
      <Action
        href="/favorites"
        icon="heart"
        activeIcon="heart-filled"
        label="Избранное"
        caption="Избранное"
        alsoActiveOn={['/account/favorites']}
        count={hydrated ? favoritesCount : undefined}
      />
      <Action
        href="/account"
        icon="user"
        label={user ? 'Личный кабинет' : 'Вход в личный кабинет'}
        caption={hydrated && user ? user.name.split(' ')[0] : 'Кабинет'}
      />
      <Action
        href="/cart"
        icon="cart"
        label="Корзина"
        caption="Корзина"
        alsoActiveOn={['/checkout', '/order']}
        count={hydrated ? cartCount : undefined}
      />
    </div>
  );
}

/** Строка «в корзине N товаров» — используется в мобильной шапке */
export function CartSummaryText() {
  const { cartCount, hydrated } = useStore();
  if (!hydrated || cartCount === 0) return null;
  return (
    <span className="text-[13px] text-muted-foreground">
      {cartCount} {pluralize(cartCount, 'товар', 'товара', 'товаров')}
    </span>
  );
}
