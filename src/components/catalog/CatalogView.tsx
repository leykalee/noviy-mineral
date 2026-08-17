import Link from 'next/link';
import type { CatalogQuery, CatalogResult, Category } from '@/types';
import { ProductCard } from '@/components/catalog/ProductCard';
import { Filters } from '@/components/catalog/Filters';
import { FilterChips } from '@/components/catalog/FilterChips';
import { MobileFilters } from '@/components/catalog/MobileFilters';
import { Pagination } from '@/components/catalog/Pagination';
import { SortSelect } from '@/components/catalog/SortSelect';
import { Breadcrumbs, type Crumb } from '@/components/common/Breadcrumbs';
import { ButtonLink } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { productsCountLabel } from '@/lib/format';
import { buildCatalogHref } from '@/lib/catalog-query';

/**
 * Раскладка каталога (п.17 ТЗ).
 *
 * Desktop: sidebar с фильтрами + товарная область в 3 колонки на 1440 px —
 * фотография остаётся крупной. Mobile: фильтры уезжают в bottom sheet.
 */
export function CatalogView({
  result,
  query,
  pathname,
  title,
  description,
  crumbs,
  subcategories,
}: {
  result: CatalogResult;
  query: CatalogQuery;
  pathname: string;
  title: string;
  description?: string;
  crumbs: Crumb[];
  subcategories?: { category: Category; count: number }[];
}) {
  const { items, total, page, pageCount, facets } = result;

  return (
    <div className="container-page pb-16 pt-6">
      <Breadcrumbs items={crumbs} />

      <header className="mt-4 max-w-[70ch]">
        <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.015em] sm:text-[36px]">
          {title}
        </h1>
        {description && <p className="mt-3 text-[16px] text-muted-foreground">{description}</p>}
      </header>

      {subcategories && subcategories.length > 0 && (
        <nav aria-label="Подкатегории" className="mt-6">
          <ul className="flex flex-wrap gap-2">
            {subcategories.map(({ category, count }) => (
              <li key={category.id}>
                <Link
                  href={`/catalog/${category.slug}`}
                  className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-border-strong px-3.5 text-[15px] transition-colors duration-[var(--dur-fast)] hover:border-brand hover:text-brand"
                >
                  {category.name}
                  <span className="tnum text-[13px] text-muted-foreground">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="mt-8 grid gap-x-10 gap-y-6 lg:grid-cols-[264px_minmax(0,1fr)]">
        {/* фильтры: sidebar на desktop */}
        <aside className="hidden lg:block">
          <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Фильтры
          </h2>
          <Filters facets={facets} />
        </aside>

        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <MobileFilters facets={facets} total={total} />
              <p className="tnum text-[15px] text-muted-foreground">
                {total > 0 ? productsCountLabel(total) : 'Ничего не найдено'}
              </p>
            </div>
            <SortSelect />
          </div>

          <div className="mb-6">
            <FilterChips facets={facets} />
          </div>

          {items.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 md:grid-cols-3">
                {items.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priority={index < 3}
                    sizes="(min-width: 1280px) 340px, (min-width: 768px) 30vw, 45vw"
                  />
                ))}
              </div>
              <Pagination page={page} pageCount={pageCount} query={query} pathname={pathname} />
            </>
          ) : (
            <EmptyResults pathname={pathname} query={query} />
          )}
        </div>
      </div>
    </div>
  );
}

/** Пустая выдача помогает выбраться, а не просто сообщает о неудаче (п.31, п.65 ТЗ) */
function EmptyResults({ pathname, query }: { pathname: string; query: CatalogQuery }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface px-6 py-14 text-center">
      <Icon name="search" size={32} className="mx-auto text-muted-foreground" />
      <h2 className="mt-4 text-[20px] font-semibold">
        {query.q ? `По запросу «${query.q}» ничего не нашли` : 'По выбранным фильтрам ничего нет'}
      </h2>
      <ul className="mx-auto mt-3 max-w-[46ch] space-y-1 text-[15px] text-muted-foreground">
        <li>Проверьте написание</li>
        <li>Измените запрос или снимите часть фильтров</li>
        <li>Попробуйте искать по минералу или месторождению</li>
      </ul>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ButtonLink href={buildCatalogHref(pathname, { q: query.q, sort: query.sort })} variant="secondary">
          Сбросить фильтры
        </ButtonLink>
        <ButtonLink href="/catalog/minerals">Смотреть все минералы</ButtonLink>
      </div>
    </div>
  );
}

/** Скелетон выдачи — показывается, пока сервер считает фильтры */
export function CatalogSkeleton() {
  return (
    <div className="container-page pb-16 pt-6">
      <div className="skeleton h-4 w-64 rounded-[var(--radius-xs)]" />
      <div className="skeleton mt-6 h-9 w-80 rounded-[var(--radius-xs)]" />
      <div className="mt-8 grid gap-x-10 gap-y-6 lg:grid-cols-[264px_minmax(0,1fr)]">
        <div className="hidden space-y-4 lg:block">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-12 rounded-[var(--radius-sm)]" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton aspect-4/3 rounded-[var(--radius-md)]" />
              <div className="skeleton mt-3 h-4 w-3/4 rounded-[var(--radius-xs)]" />
              <div className="skeleton mt-2 h-5 w-24 rounded-[var(--radius-xs)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
