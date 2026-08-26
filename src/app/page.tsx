import { ProductCard } from '@/components/catalog/ProductCard';
import { CatalogSections } from '@/components/home/CatalogSections';
import { Editorial } from '@/components/home/Editorial';
import { Hero } from '@/components/home/Hero';
import { LeadForm } from '@/components/home/LeadForm';
import { MineralRows } from '@/components/home/MineralRows';
import { NewsTeaser } from '@/components/home/NewsTeaser';
import { SectionHeader } from '@/components/home/SectionHeader';
import {
  getCatalogSections,
  getFeaturedProducts,
  getMineralShowcases,
  getNewArrivals,
} from '@/lib/repository';
import { fetchNews } from '@/lib/news';

/**
 * Главная построена по структуре rusmineral.ru — сайта, на который ориентируется
 * заказчик: первый экран → разделы каталога плитками → новинки со вступлением →
 * ленты товаров по минеральным видам → новости и выставки → о магазине.
 *
 * Композиция блоков повторена, оформление наше: адаптивная сетка, наши цвета
 * и типографика. Референс свёрстан под фиксированную ширину и на телефоне
 * не работает — копировать это было бы шагом назад.
 */

export const revalidate = 300;

export default async function HomePage() {
  const [featured, newArrivals, sections, mineralRows, news] = await Promise.all([
    getFeaturedProducts(8),
    getNewArrivals(8),
    getCatalogSections(),
    getMineralShowcases(3, 3),
    fetchNews(3),
  ]);

  // в editorial и в форме показываем разные экземпляры, иначе фото дублируется
  const editorialProduct = featured.find((p) => p.uniquePiece);
  const leadProduct = featured.find((p) => p.uniquePiece && p.id !== editorialProduct?.id);

  return (
    <>
      <Hero product={featured[0]} />

      {sections.length > 0 && (
        <section className="container-page pt-14 lg:pt-20" aria-labelledby="sections-title">
          <SectionHeader
            id="sections-title"
            title="Разделы каталога"
            action={{ label: 'Весь каталог', href: '/catalog' }}
          />
          <CatalogSections sections={sections} />
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="container-page pt-16 lg:pt-24" aria-labelledby="new-title">
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

      {mineralRows.length > 0 && (
        <section className="container-page pt-16 lg:pt-24" aria-labelledby="minerals-title">
          <SectionHeader
            id="minerals-title"
            title="По минералам"
            description="Экземпляры одного вида собраны рядом — так проще сравнить размер, форму и цену."
            action={{ label: 'Все минералы', href: '/catalog/minerals' }}
          />
          <MineralRows showcases={mineralRows} />
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
