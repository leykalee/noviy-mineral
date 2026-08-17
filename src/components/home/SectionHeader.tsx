import Link from 'next/link';
import { Icon } from '@/components/common/Icon';

/** Заголовок секции на главной: название + ссылка «смотреть все» */
export function SectionHeader({
  title,
  description,
  action,
  id,
}: {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  id?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 lg:mb-8">
      <div>
        <h2
          id={id}
          className="text-[26px] font-semibold leading-tight tracking-[-0.01em] sm:text-[30px]"
        >
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-[60ch] text-[15px] text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-1.5 text-[15px] font-medium text-brand transition-colors duration-[var(--dur-fast)] hover:text-brand-hover"
        >
          {action.label}
          <Icon name="arrow-right" size={18} />
        </Link>
      )}
    </div>
  );
}
