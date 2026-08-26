import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CatalogSkeleton, CatalogView } from '@/components/catalog/CatalogView';
import {
  hasActiveFilters,
  parseCatalogQuery,
  type SearchParamsInput,
} from '@/lib/catalog-query';
import { countProductsInCategory, queryProducts } from '@/lib/repository';
import {
  fetchCategoryBySlug,
  fetchCategoryPath,
  fetchChildCategories,
} from '@/lib/taxonomy-remote';

// Категории приходят из Admik в рантайме — страница динамическая.
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<SearchParamsInput>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await fetchCategoryBySlug(slug);
  if (!category) return { title: 'Категория не найдена' };

  const query = parseCatalogQuery(await searchParams);
  const filtered = hasActiveFilters(query) || Boolean(query.q) || (query.page ?? 1) > 1;

  return {
    title: category.name,
    description: category.description ?? `${category.name} — каталог магазина «Новый Минерал».`,
    alternates: { canonical: `/catalog/${category.slug}` },
    robots: filtered ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<SearchParamsInput>;
}) {
  const { category: slug } = await params;
  const category = await fetchCategoryBySlug(slug);
  if (!category) notFound();

  const rawParams = await searchParams;
  const query = parseCatalogQuery(rawParams);

  return (
    <Suspense fallback={<CatalogSkeleton />} key={slug + JSON.stringify(rawParams)}>
      <CategoryContent slug={slug} query={query} />
    </Suspense>
  );
}

async function CategoryContent({
  slug,
  query,
}: {
  slug: string;
  query: ReturnType<typeof parseCatalogQuery>;
}) {
  const [category, children, trail, result] = await Promise.all([
    fetchCategoryBySlug(slug),
    fetchChildCategories(slug),
    fetchCategoryPath(slug),
    queryProducts(query, { categorySlug: slug }),
  ]);
  if (!category) notFound();

  const childCounts = await Promise.all(children.map((c) => countProductsInCategory(c.slug)));

  const crumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Каталог', href: '/catalog' },
    ...trail.map((c, index, all) => ({
      label: c.name,
      href: index === all.length - 1 ? undefined : `/catalog/${c.slug}`,
    })),
  ];

  return (
    <CatalogView
      result={result}
      query={query}
      pathname={`/catalog/${slug}`}
      title={category.name}
      description={category.description}
      crumbs={crumbs}
      subcategories={children.map((c, i) => ({ category: c, count: childCounts[i] }))}
    />
  );
}
