import { ProductCard } from '@/components/catalog/ProductCard';
import { Editorial } from '@/components/home/Editorial';
import { Hero } from '@/components/home/Hero';
import { LeadForm } from '@/components/home/LeadForm';
import { NewsTeaser } from '@/components/home/NewsTeaser';
import { SectionHeader } from '@/components/home/SectionHeader';
import { getFeaturedProducts, getNewArrivals } from '@/lib/repository';
import { fetchNews } from '@/lib/news';

/**
 * Главная: помогает начать выбор, а не рассказывает о компании.
 * Первый экран → новинки → новости → editorial → вопрос магазину.
 *
 * Плитки категорий с главной убраны: они дублировали меню «Каталог».
 * Блок «Что ищете?» заменён анонсом новостей — отчёты с выставок для
 * коллекционера ценнее, чем ещё один набор ссылок в тот же каталог.
 */

// Каталог/категории — из Admik в рантайме.
export const dynamic = 'force-dynamic';

/** Каталог может быть недоступен (Admik не настроен) — главная всё равно должна открываться */
async function safely<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export default async function HomePage() {
  const [featured, newArrivals, news] = await Promise.all([
    safely(getFeaturedProducts(8), []),
    safely(getNewArrivals(8), []),
    fetchNews(3),
  ]);

  // в editorial и в форме показываем разные экземпляры, иначе фото дублируется
  const editorialProduct = featured.find((p) => p.uniquePiece);
  const leadProduct = featured.find((p) => p.uniquePiece && p.id !== editorialProduct?.id);

  return (
    <>
      <Hero product={featured[0]} />

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

      <section className="container-page pt-16 lg:pt-24" aria-labelledby="news-title">
        <SectionHeader
          id="news-title"
          title="Новости и выставки"
          description="Отчёты с выставок, новые поступления и события магазина."
          action={{ label: 'Все новости', href: '/news' }}
        />
        <NewsTeaser posts={news.posts} connected={news.connected} />
      </section>

      <div className="pt-16 lg:pt-24">
        <Editorial product={editorialProduct} />
      </div>

      <LeadForm product={leadProduct} />
    </>
  );
}
