import { ProductCard } from '@/components/catalog/ProductCard';
import { Icon } from '@/components/common/Icon';
import { Editorial } from '@/components/home/Editorial';
import { HeroSlider } from '@/components/home/HeroSlider';
import { LeadForm } from '@/components/home/LeadForm';
import { NewsTeaser } from '@/components/home/NewsTeaser';
import { SectionHeader } from '@/components/home/SectionHeader';
import { getFeaturedProducts, getHeroSlides, getNewArrivals } from '@/lib/repository';
import { fetchNews } from '@/lib/news';

/**
 * Главная. Первый экран оформлен по образцу rusmineral.ru — сайта, на который
 * ориентируется заказчик: тёмная карусель разделов во всю ширину, крупный
 * снимок и заголовок раздела прописными.
 *
 * Плитки разделов отдельным блоком не нужны: карусель уже ведёт в каталог.
 */

// Данные каталога — из Admik в рантайме (headless-потребитель).
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [slides, featured, newArrivals, news] = await Promise.all([
    getHeroSlides(),
    getFeaturedProducts(8),
    getNewArrivals(8),
    fetchNews(3),
  ]);

  // в editorial и в форме показываем разные экземпляры, иначе фото дублируется
  // В крупный блок берём коллекционный минерал: у образцов фото 4:3 и они
  // аккуратно вписываются в кадр, тогда как квадратные фото (шары/изделия)
  // обрезались бы по краям. Отбор по ветке категорий минералов надёжнее, чем по
  // kind (у части товаров slug категории латиницей и не распознаётся).
  const MINERAL_CATS = new Set([
    'minerals', 'crystals', 'druzes', 'polished', 'tumbled', 'fossils',
  ]);
  const editorialProduct =
    featured.find((p) => p.uniquePiece && MINERAL_CATS.has(p.categoryId)) ??
    featured.find((p) => p.uniquePiece);
  const leadProduct = featured.find((p) => p.uniquePiece && p.id !== editorialProduct?.id);

  return (
    <>
      <HeroSlider slides={slides} />

      {/* Заголовок страницы вынесен под карусель: на слайдах стоят названия
          разделов, а поисковику и скринридеру нужен один H1 про сам магазин. */}
      <section className="container-page pt-10 lg:pt-14" aria-labelledby="hero-title">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <h1
            id="hero-title"
            className="max-w-[22ch] text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[38px] lg:text-[44px]"
          >
            Коллекционные минералы и изделия из натурального камня
          </h1>
          <p className="inline-flex items-center gap-2 rounded-[var(--radius-xs)] bg-brand-soft px-3 py-1.5 text-[13px] font-medium text-brand">
            <Icon name="sparkle" size={15} />
            Каждый образец продаётся отдельным экземпляром
          </p>
        </div>
      </section>

      {newArrivals.length > 0 && (
        <section className="container-page pt-14 lg:pt-20" aria-labelledby="new-title">
          <SectionHeader
            id="new-title"
            title="Новинки"
            description="Свежие поступления с выставок и от поставщиков. Коллекционные образцы приходят
              поштучно, поэтому редкие экземпляры разбирают в первые дни."
            action={{ label: 'Перейти к новинкам', href: '/new' }}
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
