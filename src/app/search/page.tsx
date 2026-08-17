import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CatalogSkeleton, CatalogView } from '@/components/catalog/CatalogView';
import { SearchBar } from '@/components/search/SearchBar';
import { parseCatalogQuery, type SearchParamsInput } from '@/lib/catalog-query';
import { queryProducts } from '@/lib/repository';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}): Promise<Metadata> {
  const query = parseCatalogQuery(await searchParams);
  return {
    title: query.q ? `Поиск: ${query.q}` : 'Поиск',
    // страницы результатов поиска индексировать не нужно
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const params = await searchParams;
  const query = parseCatalogQuery(params);

  return (
    <div>
      <div className="container-page pt-6">
        <div className="mx-auto max-w-[720px]">
          <SearchBar initialQuery={query.q ?? ''} />
        </div>
      </div>
      <Suspense fallback={<CatalogSkeleton />} key={JSON.stringify(params)}>
        <SearchResults query={query} />
      </Suspense>
    </div>
  );
}

async function SearchResults({ query }: { query: ReturnType<typeof parseCatalogQuery> }) {
  const result = await queryProducts(query);

  return (
    <CatalogView
      result={result}
      query={query}
      pathname="/search"
      title={query.q ? `Поиск: ${query.q}` : 'Поиск по каталогу'}
      description={
        query.q
          ? undefined
          : 'Введите название минерала, месторождение или артикул — например, «флюорит» или «НМ-1108».'
      }
      crumbs={[{ label: 'Главная', href: '/' }, { label: 'Поиск' }]}
    />
  );
}
