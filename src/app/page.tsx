import { ProductCard } from '@/components/catalog/ProductCard';
import { CategoryTiles } from '@/components/home/CategoryTiles';
import { Editorial } from '@/components/home/Editorial';
import { Hero } from '@/components/home/Hero';
import { MineralTiles } from '@/components/home/MineralTiles';
import { ScenarioLinks } from '@/components/home/ScenarioLinks';
import { SectionHeader } from '@/components/home/SectionHeader';
import { categoryBySlug, minerals } from '@/data/demo/taxonomy';
import {
  countProductsByMineral,
  countProductsInCategory,
  getFeaturedProducts,
  getNewArrivals,
} from '@/lib/repository';

/**
 * Главная (п.11 ТЗ): помогает начать выбор, а не рассказывает о компании.
 * Порядок блоков — Hero → категории → новинки → подбор по сценарию →
 * популярные минералы → editorial.
 */

export const revalidate = 300;

const HOME_CATEGORY_SLUGS = ['minerals', 'crafts', 'jewelry', 'books', 'accessories'];

export default async function HomePage() {
  const [featured, newArrivals] = await Promise.all([getFeaturedProducts(8), getNewArrivals(8)]);

  const categoryTiles = (
    await Promise.all(
      HOME_CATEGORY_SLUGS.map(async (slug) => {
        const category = categoryBySlug.get(slug);
        if (!category) return null;
        return { category, count: await countProductsInCategory(slug) };
      }),
    )
  ).filter((item): item is { category: NonNullable<ReturnType<typeof categoryBySlug.get>>; count: number } =>
    Boolean(item),
  );

  const popularMinerals = (
    await Promise.all(
      minerals
        .filter((m) => m.isPopular)
        .slice(0, 6)
        .map(async (mineral) => ({ mineral, count: await countProductsByMineral(mineral.slug) })),
    )
  ).filter((item) => item.count > 0);

  return (
    <>
      <Hero products={featured.slice(0, 3)} />

      <section className="container-page pt-16 lg:pt-24" aria-labelledby="categories-title">
        <SectionHeader id="categories-title" title="Категории" />
        <CategoryTiles items={categoryTiles} />
      </section>

      {newArrivals.length > 0 && (
        <section className="container-page pt-16 lg:pt-24" aria-labelledby="new-title">
          <SectionHeader
            id="new-title"
            title="Новые поступления"
            action={{ label: 'Все новинки', href: '/new' }}
          />
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {newArrivals.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 4} />
            ))}
          </div>
        </section>
      )}

      <section className="container-page pt-16 lg:pt-24" aria-labelledby="scenario-title">
        <SectionHeader
          id="scenario-title"
          title="Что ищете?"
          description="Быстрый переход в каталог с готовыми фильтрами."
        />
        <ScenarioLinks />
      </section>

      {popularMinerals.length > 0 && (
        <section className="container-page pt-16 lg:pt-24" aria-labelledby="minerals-title">
          <SectionHeader
            id="minerals-title"
            title="Популярные минералы"
            action={{ label: 'Весь каталог', href: '/catalog' }}
          />
          <MineralTiles items={popularMinerals} />
        </section>
      )}

      <div className="pt-16 lg:pt-24">
        <Editorial product={featured.find((p) => p.uniquePiece)} />
      </div>
    </>
  );
}
