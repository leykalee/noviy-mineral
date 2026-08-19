import Link from 'next/link';
import { Icon, type IconName } from '@/components/common/Icon';
import { scenarioLinks } from '@/config/navigation';
import { cx } from '@/lib/cx';

/**
 * Блок «Что ищете?» (п.14 ТЗ) — вход в каталог для новичка, который
 * не знает названий минералов. Каждая ссылка ведёт на реально отфильтрованный
 * каталог, а не на общую страницу.
 *
 * Сценарии различаются не только подписью: у каждого своя иконка и своя
 * цветовая температура — тёплая у «подарочных», холодная у коллекционных.
 * Это делает блок навигационным, а не рядом одинаковых серых чипсов.
 */

const decor: Record<string, { icon: IconName; tone: 'brand' | 'accent' }> = {
  'Для коллекции': { icon: 'sparkle', tone: 'brand' },
  'В подарок': { icon: 'package', tone: 'accent' },
  'Для интерьера': { icon: 'pin', tone: 'brand' },
  'До 1 500 ₽': { icon: 'card', tone: 'accent' },
  'До 3 000 ₽': { icon: 'card', tone: 'accent' },
  'Светятся в УФ': { icon: 'zoom', tone: 'brand' },
};

export function ScenarioLinks() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {scenarioLinks.map((link) => {
        const { icon, tone } = decor[link.label] ?? { icon: 'sparkle' as const, tone: 'brand' as const };
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              className={cx(
                'group flex h-full flex-col justify-between gap-6 rounded-[var(--radius-md)] p-4 transition-colors duration-[var(--dur-fast)]',
                tone === 'brand'
                  ? 'bg-brand-soft hover:bg-brand-soft-hover'
                  : 'bg-accent-soft hover:bg-[color-mix(in_srgb,var(--accent-soft)_88%,var(--accent))]',
              )}
            >
              <span
                className={cx(
                  'grid size-10 place-items-center rounded-full bg-white',
                  tone === 'brand' ? 'text-brand' : 'text-accent',
                )}
              >
                <Icon name={icon} size={20} />
              </span>
              <span className="flex items-end justify-between gap-2">
                <span className="text-[15px] font-medium leading-snug text-foreground">
                  {link.label}
                </span>
                <Icon
                  name="arrow-right"
                  size={18}
                  className={cx(
                    'shrink-0 transition-transform duration-[var(--dur-fast)] group-hover:translate-x-0.5',
                    tone === 'brand' ? 'text-brand' : 'text-accent',
                  )}
                />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
