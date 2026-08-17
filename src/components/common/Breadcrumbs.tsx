import Link from 'next/link';
import { Icon } from '@/components/common/Icon';

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Хлебные крошки + разметка BreadcrumbList (п.56 ТЗ).
 * Последний элемент — текущая страница, без ссылки.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: item.href } : {}),
    })),
  };

  return (
    <>
      <nav aria-label="Хлебные крошки">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[14px] text-muted-foreground">
          {items.map((item, index) => {
            const last = index === items.length - 1;
            return (
              <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                {index > 0 && (
                  <Icon name="chevron-right" size={14} className="shrink-0 opacity-60" />
                )}
                {item.href && !last ? (
                  <Link
                    href={item.href}
                    className="transition-colors duration-[var(--dur-fast)] hover:text-brand"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current={last ? 'page' : undefined} className={last ? 'text-foreground' : ''}>
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
