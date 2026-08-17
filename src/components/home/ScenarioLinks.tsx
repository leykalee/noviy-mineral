import Link from 'next/link';
import { Icon } from '@/components/common/Icon';
import { scenarioLinks } from '@/config/navigation';

/**
 * Блок «Что ищете?» (п.14 ТЗ) — вход в каталог для новичка, который
 * не знает названий минералов. Каждая ссылка ведёт на реально отфильтрованный
 * каталог, а не на общую страницу.
 */
export function ScenarioLinks() {
  return (
    <ul className="flex flex-wrap gap-2.5">
      {scenarioLinks.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-border-strong bg-white px-4 text-[15px] transition-colors duration-[var(--dur-fast)] hover:border-brand hover:bg-brand-soft hover:text-brand"
          >
            {link.label}
            <Icon name="chevron-right" size={16} className="text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
