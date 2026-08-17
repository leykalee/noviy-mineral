import type { ProductStatus } from '@/types';
import { statusLabels } from '@/lib/format';
import { cx } from '@/lib/cx';

/**
 * Статус экземпляра.
 *
 * Статус никогда не передаётся одним лишь цветом (п.55 ТЗ) — всегда есть текст,
 * а форма плашки различается заливкой и рамкой.
 */

const styles: Record<ProductStatus, string> = {
  available: 'bg-success-soft text-success',
  reserved: 'bg-warning-soft text-warning',
  sold_out: 'bg-muted text-muted-foreground',
};

export function StatusBadge({
  status,
  size = 'md',
  className,
}: {
  status: ProductStatus;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-[var(--radius-xs)] font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[12px]' : 'px-2.5 py-1 text-[13px]',
        styles[status],
        className,
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

/** Метка «Новинка» / «−15 %» на карточке */
export function Tag({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'brand' | 'sale';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-white/92 text-foreground',
    brand: 'bg-brand text-white',
    sale: 'bg-danger text-white',
  } as const;

  return (
    <span
      className={cx(
        'inline-flex items-center rounded-[var(--radius-xs)] px-2 py-1 text-[12px] font-medium leading-none',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
