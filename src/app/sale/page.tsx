import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CatalogSkeleton, CatalogView } from '@/components/catalog/CatalogView';
import { parseCatalogQuery, type SearchParamsInput } from '@/lib/catalog-query';
import { queryProducts } from '@/lib/repository';

export const metadata: Metadata = {
  title: 'Акции',
  description: 'Экземпляры со скидкой в каталоге «Нового Минерала».',
  alternates: { canonical: '/sale' },
};

export default async function SalePage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const params = await searchParams;
  const query = { ...parseCatalogQuery(params), onSale: true };

  return (
    <Suspense fallback={<CatalogSkeleton />} key={JSON.stringify(params)}>
      <SaleContent query={query} />
    </Suspense>
  );
}

async function SaleContent({ query }: { query: ReturnType<typeof parseCatalogQuery> }) {
  const result = await queryProducts(query);

  return (
    <CatalogView
      result={result}
      query={query}
      pathname="/sale"
      title="Акции"
      description="Экземпляры, на которые действует скидка."
      crumbs={[{ label: 'Главная', href: '/' }, { label: 'Акции' }]}
    />
  );
}
