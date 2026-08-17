import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CatalogSkeleton, CatalogView } from '@/components/catalog/CatalogView';
import { parseCatalogQuery, type SearchParamsInput } from '@/lib/catalog-query';
import { queryProducts } from '@/lib/repository';

export const metadata: Metadata = {
  title: 'Новые поступления',
  description: 'Новые экземпляры минералов, изделий и украшений в каталоге «Нового Минерала».',
  alternates: { canonical: '/new' },
};

export default async function NewPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const params = await searchParams;
  // раздел сам по себе — уже фильтр «новинки», снять его отсюда нельзя
  const query = { ...parseCatalogQuery(params), isNew: true, sort: parseCatalogQuery(params).sort ?? 'new' as const };

  return (
    <Suspense fallback={<CatalogSkeleton />} key={JSON.stringify(params)}>
      <NewContent query={query} />
    </Suspense>
  );
}

async function NewContent({ query }: { query: ReturnType<typeof parseCatalogQuery> }) {
  const result = await queryProducts(query);

  return (
    <CatalogView
      result={result}
      query={query}
      pathname="/new"
      title="Новые поступления"
      description="Экземпляры, недавно добавленные в каталог."
      crumbs={[{ label: 'Главная', href: '/' }, { label: 'Новые поступления' }]}
    />
  );
}
