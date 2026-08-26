import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CatalogSkeleton, CatalogView } from '@/components/catalog/CatalogView';
import {
  hasActiveFilters,
  parseCatalogQuery,
  type SearchParamsInput,
} from '@/lib/catalog-query';
import { countProductsInCategory, queryProducts } from '@/lib/repository';
import { fetchRootCategories } from '@/lib/taxonomy-remote';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}): Promise<Metadata> {
  const query = parseCatalogQuery(await searchParams);
  // тысячи комбинаций фильтров индексировать нельзя (п.56 ТЗ)
  const filtered = hasActiveFilters(query) || Boolean(query.q) || (query.page ?? 1) > 1;

  return {
    title: 'Каталог',
    description:
      'Коллекционные минералы, изделия из камня, украшения, книги и сопутствующие товары. Фильтры по минералу, месторождению, цене, размеру и весу.',
    alternates: { canonical: '/catalog' },
    robots: filtered ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const params = await searchParams;
  const query = parseCatalogQuery(params);

  return (
    // ключ по параметрам: при смене фильтров показываем скелетон, а не «залипшую» выдачу
    <Suspense fallback={<CatalogSkeleton />} key={JSON.stringify(params)}>
      <CatalogContent query={query} />
    </Suspense>
  );
}

async function CatalogContent({ query }: { query: ReturnType<typeof parseCatalogQuery> }) {
  const topLevel = await fetchRootCategories();

  // независимые запросы идут параллельно, а не цепочкой
  const [result, counts] = await Promise.all([
    queryProducts(query),
    Promise.all(topLevel.map((c) => countProductsInCategory(c.slug))),
  ]);

  return (
    <CatalogView
      result={result}
      query={query}
      pathname="/catalog"
      title="Каталог"
      description="Коллекционные образцы, изделия из камня, украшения, книги и сопутствующие товары."
      crumbs={[{ label: 'Главная', href: '/' }, { label: 'Каталог' }]}
      subcategories={topLevel.map((category, i) => ({ category, count: counts[i] }))}
    />
  );
}
