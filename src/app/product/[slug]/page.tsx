import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/catalog/ProductCard';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { FavoriteButton } from '@/components/common/FavoriteButton';
import { Icon } from '@/components/common/Icon';
import { StatusBadge } from '@/components/common/StatusBadge';
import { AddToCart } from '@/components/product/AddToCart';
import { Gallery } from '@/components/product/Gallery';
import { RecentlyViewed, TrackView } from '@/components/product/RecentlyViewed';
import { StickyMobileBar } from '@/components/product/StickyMobileBar';
import { storeConfig } from '@/config/store';
import { featureLabels } from '@/data/demo/taxonomy';
import {
  discountPercent,
  formatDimensions,
  formatPrice,
  formatWeight,
} from '@/lib/format';
import { getProductBySlug, getRelatedProducts } from '@/lib/repository';
import { fetchCategoryPath } from '@/lib/taxonomy-remote';

// Каталог приходит из Admik в рантайме — страница товара рендерится динамически.
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Товар не найден' };

  const origin = [product.region, product.country].filter(Boolean).join(', ');
  const description =
    product.shortDescription ??
    `${product.name}${origin ? `, ${origin}` : ''}. Артикул ${product.sku}.`;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: `${product.name} — ${storeConfig.name}`,
      description,
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
      type: 'website',
    },
  };
}

const ADD_TO_CART_ID = 'buy-block';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, categoryTrail] = await Promise.all([
    getRelatedProducts(product, 8),
    product.categoryId ? fetchCategoryPath(product.categoryId) : Promise.resolve([]),
  ]);

  const category = categoryTrail[categoryTrail.length - 1] ?? null;
  const discount = discountPercent(product.price, product.oldPrice);
  const dimensions = formatDimensions(product.width, product.height, product.depth);
  const weight = formatWeight(product.weight);

  /** Только заполненные строки — «Вес: —» не выводим (п.27 ТЗ) */
  const specs: { label: string; value: string; href?: string }[] = [
    { label: 'Артикул', value: product.sku },
    product.mineralName
      ? { label: 'Минерал', value: product.mineralName, href: `/search?q=${encodeURIComponent(product.mineralName)}` }
      : null,

    product.depositName
      ? { label: 'Месторождение', value: product.depositName, href: `/search?q=${encodeURIComponent(product.depositName)}` }
      : null,
    product.country
      ? { label: 'Страна', value: product.country, href: `/catalog?country=${encodeURIComponent(product.country)}` }
      : null,
    product.region
      ? { label: 'Регион', value: product.region, href: `/catalog?region=${encodeURIComponent(product.region)}` }
      : null,
    dimensions ? { label: 'Размеры', value: dimensions } : null,
    weight ? { label: 'Вес', value: weight } : null,
    product.material ? { label: 'Материал', value: product.material } : null,
    product.features?.length
      ? { label: 'Особенности', value: product.features.map((f) => featureLabels[f]).join(', ') }
      : null,
  ].filter((row): row is { label: string; value: string; href?: string } => Boolean(row));

  /** Что показать рядом с кнопкой покупки: самое важное, без повторения всей таблицы */
  const keySpecs = specs.filter((row) => row.label !== 'Артикул').slice(0, 5);

  const crumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Каталог', href: '/catalog' },
    ...categoryTrail.map((c) => ({ label: c.name, href: `/catalog/${c.slug}` })),
    { label: product.name },
  ];

  // Product JSON-LD: цена и наличие соответствуют реальному состоянию товара
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    description: product.shortDescription ?? product.description ?? undefined,
    image: product.images.map((i) => i.url),
    category: category?.name,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'RUB',
      availability:
        product.status === 'available'
          ? 'https://schema.org/InStock'
          : product.status === 'reserved'
            ? 'https://schema.org/PreOrder'
            : 'https://schema.org/SoldOut',
    },
  };

  return (
    <div className="container-page pb-16 pt-6">
      <TrackView productId={product.id} />
      <Breadcrumbs items={crumbs} />

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] lg:gap-14">
        {/* на мобильных галерея идёт первой — так требует п.53 ТЗ */}
        <div>
          <Gallery images={product.images} name={product.name} />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={product.status} />
            {product.isNew && product.status === 'available' && (
              <span className="rounded-[var(--radius-xs)] bg-brand-soft px-2.5 py-1 text-[13px] font-medium text-brand">
                Новинка
              </span>
            )}
          </div>

          <h1 className="mt-3 text-[28px] font-semibold leading-tight tracking-[-0.015em] sm:text-[34px]">
            {product.name}
          </h1>

          <p className="tnum mt-1.5 text-[14px] text-muted-foreground">Артикул {product.sku}</p>

          {product.shortDescription && (
            <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">
              {product.shortDescription}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="tnum text-[32px] font-semibold leading-none">
              {formatPrice(product.price)}
            </span>
            {product.oldPrice && product.oldPrice > product.price && (
              <>
                <span className="tnum text-[18px] text-muted-foreground line-through">
                  {formatPrice(product.oldPrice)}
                </span>
                {discount && (
                  <span className="rounded-[var(--radius-xs)] bg-danger-soft px-2 py-1 text-[14px] font-medium text-danger">
                    −{discount}%
                  </span>
                )}
              </>
            )}
          </div>

          {product.uniquePiece && (
            <p className="mt-5 flex items-start gap-2.5 rounded-[var(--radius-sm)] bg-brand-soft px-4 py-3 text-[15px] text-brand">
              <Icon name="sparkle" size={18} className="mt-0.5 shrink-0" />
              <span>
                <strong className="font-semibold">Вы покупаете именно экземпляр с фотографий.</strong>{' '}
                Второго такого же нет.
              </span>
            </p>
          )}

          <div id={ADD_TO_CART_ID} className="mt-6">
            <AddToCart product={product} />
          </div>

          <div className="mt-4">
            <FavoriteButton
              productId={product.id}
              productName={product.name}
              variant="inline"
              className="w-full sm:w-auto"
            />
          </div>

          {/* краткая сводка у покупки: артикул уже под названием, полная таблица — ниже */}
          {keySpecs.length > 0 && (
            <dl className="mt-8 divide-y divide-border border-y border-border">
              {keySpecs.map((row) => (
                <div key={row.label} className="flex gap-4 py-2.5 text-[15px]">
                  <dt className="w-[42%] shrink-0 text-muted-foreground">{row.label}</dt>
                  <dd className="flex-1">
                    {row.href ? (
                      <Link href={row.href} className="text-brand hover:underline">
                        {row.value}
                      </Link>
                    ) : (
                      row.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <p className="mt-5 flex items-start gap-2.5 text-[14px] text-muted-foreground">
            <Icon name="truck" size={18} className="mt-0.5 shrink-0" />
            <span>
              Стоимость и срок доставки рассчитываются при оформлении заказа.{' '}
              <Link href="/delivery" className="text-brand hover:underline">
                Доставка и оплата
              </Link>
            </span>
          </p>
        </div>
      </div>

      {/* Информация ниже первого экрана (п.29 ТЗ) */}
      <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] lg:gap-14">
        <div className="space-y-10">
          {product.description && (
            <section aria-labelledby="about-title">
              <h2 id="about-title" className="mb-3 text-[22px] font-semibold">
                Об экземпляре
              </h2>
              <p className="max-w-[70ch] text-[16px] leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </section>
          )}

          <section aria-labelledby="specs-title">
            <h2 id="specs-title" className="mb-3 text-[22px] font-semibold">
              Характеристики
            </h2>
            <table className="w-full max-w-[560px] text-[15px]">
              <tbody className="divide-y divide-border">
                {specs.map((row) => (
                  <tr key={row.label}>
                    <th scope="row" className="py-2.5 pr-4 text-left font-normal text-muted-foreground">
                      {row.label}
                    </th>
                    <td className="py-2.5">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

        </div>

        <aside>
          <section
            aria-labelledby="delivery-title"
            className="rounded-[var(--radius-md)] bg-surface p-5"
          >
            <h2 id="delivery-title" className="mb-3 text-[18px] font-semibold">
              Доставка и оплата
            </h2>
            <ul className="space-y-2.5 text-[15px] text-muted-foreground">
              <li className="flex gap-2.5">
                <Icon name="truck" size={18} className="mt-0.5 shrink-0" />
                Доставка СДЭК: пункт выдачи или курьер. Стоимость считается по адресу при оформлении.
              </li>
              <li className="flex gap-2.5">
                <Icon name="card" size={18} className="mt-0.5 shrink-0" />
                Оплата онлайн. Способы показываются на шаге оформления.
              </li>
              <li className="flex gap-2.5">
                <Icon name="package" size={18} className="mt-0.5 shrink-0" />
                Хрупкие образцы упаковываются отдельно.
              </li>
            </ul>
            <Link
              href="/delivery"
              className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-medium text-brand hover:underline"
            >
              Подробные условия
              <Icon name="arrow-right" size={17} />
            </Link>
          </section>
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-16">
          <h2 id="related-title" className="mb-6 text-[24px] font-semibold tracking-[-0.01em]">
            {product.status === 'available' ? 'Похожие экземпляры' : 'Доступны сейчас'}
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {related.slice(0, 8).map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewed excludeId={product.id} />

      <StickyMobileBar product={product} watchId={ADD_TO_CART_ID} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
