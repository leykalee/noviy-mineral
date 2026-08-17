import Link from 'next/link';
import type { CatalogQuery } from '@/types';
import { Icon } from '@/components/common/Icon';
import { buildCatalogHref } from '@/lib/catalog-query';
import { cx } from '@/lib/cx';

/**
 * Обычная постраничная навигация (п.58 ТЗ).
 * Ссылки настоящие: `?page=2` открывается напрямую и индексируется.
 */
export function Pagination({
  page,
  pageCount,
  query,
  pathname,
}: {
  page: number;
  pageCount: number;
  query: CatalogQuery;
  pathname: string;
}) {
  if (pageCount <= 1) return null;

  const href = (target: number) =>
    buildCatalogHref(pathname, { ...query, page: target === 1 ? undefined : target });

  // всегда показываем первую, последнюю, текущую и соседей
  const pages: (number | 'gap')[] = [];
  for (let i = 1; i <= pageCount; i++) {
    if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== 'gap') {
      pages.push('gap');
    }
  }

  const itemClass =
    'inline-flex h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] px-3 text-[15px] transition-colors duration-[var(--dur-fast)]';

  return (
    <nav aria-label="Навигация по страницам" className="mt-10 flex justify-center">
      <ul className="flex flex-wrap items-center gap-1.5">
        <li>
          {page > 1 ? (
            <Link
              href={href(page - 1)}
              rel="prev"
              aria-label="Предыдущая страница"
              className={cx(itemClass, 'border border-border-strong hover:border-brand hover:text-brand')}
            >
              <Icon name="chevron-left" size={18} />
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className={cx(itemClass, 'border border-border text-muted-foreground opacity-50')}
            >
              <Icon name="chevron-left" size={18} />
            </span>
          )}
        </li>

        {pages.map((item, index) =>
          item === 'gap' ? (
            <li key={`gap-${index}`} className="px-1 text-muted-foreground" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={href(item)}
                aria-current={item === page ? 'page' : undefined}
                className={cx(
                  itemClass,
                  'tnum',
                  item === page
                    ? 'bg-brand font-medium text-white'
                    : 'border border-border-strong hover:border-brand hover:text-brand',
                )}
              >
                {item}
              </Link>
            </li>
          ),
        )}

        <li>
          {page < pageCount ? (
            <Link
              href={href(page + 1)}
              rel="next"
              aria-label="Следующая страница"
              className={cx(itemClass, 'border border-border-strong hover:border-brand hover:text-brand')}
            >
              <Icon name="chevron-right" size={18} />
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className={cx(itemClass, 'border border-border text-muted-foreground opacity-50')}
            >
              <Icon name="chevron-right" size={18} />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
