import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types';
import { ButtonLink } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { formatPrice } from '@/lib/format';
import { cx } from '@/lib/cx';

/**
 * Первый экран.
 *
 * Не рекламный баннер: слева сообщение и два действия, справа — один крупный
 * экземпляр из каталога. Раньше здесь была сетка из трёх фотографий, но мелкие
 * плитки дробили первый экран и мешали продукту звучать в полный голос.
 */
export function Hero({ product }: { product?: Product }) {
  const origin = product ? [product.region, product.country].filter(Boolean).join(', ') : '';

  return (
    <section className="container-page pt-8 lg:pt-14" aria-labelledby="hero-title">
      {/* без фотографии колонка не резервируется, иначе справа зияет пустота */}
      <div
        className={cx(
          'grid gap-10 lg:items-center lg:gap-14',
          product?.images[0] ? 'lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]' : 'max-w-[70ch]',
        )}
      >
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-[var(--radius-xs)] bg-brand-soft px-3 py-1.5 text-[13px] font-medium text-brand">
            <Icon name="sparkle" size={15} />
            Каждый образец продаётся отдельным экземпляром
          </p>

          <h1
            id="hero-title"
            className="text-[34px] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[44px] lg:text-[54px]"
          >
            Коллекционные минералы и изделия из натурального камня
          </h1>

          <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-muted-foreground lg:text-[18px]">
            Редкие образцы, украшения и изделия из камня для коллекции, интерьера и подарка.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/catalog" size="lg">
              Смотреть каталог
            </ButtonLink>
            <ButtonLink href="/new" size="lg" variant="secondary">
              Новые поступления
            </ButtonLink>
          </div>
        </div>

        {product?.images[0] && (
          <Link
            href={`/product/${product.slug}`}
            className="group relative block aspect-4/3 overflow-hidden rounded-[var(--radius-lg)] bg-surface-strong lg:aspect-16/11"
          >
            <Image
              src={product.images[0].url}
              alt={product.images[0].alt || product.name}
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              priority
              className="object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease)] group-hover:scale-[1.03]"
            />
            {/* градиент только снизу — подпись должна читаться, но фото остаётся главным */}
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/75 to-transparent p-4 pt-14 sm:p-6 sm:pt-16">
              <span className="block text-[17px] font-medium text-white sm:text-[19px]">
                {product.name}
              </span>
              <span className="mt-0.5 flex items-center gap-3 text-[14px] text-white/80">
                {origin && <span className="truncate">{origin}</span>}
                <span className="tnum ml-auto shrink-0 text-[16px] font-medium text-white">
                  {formatPrice(product.price)}
                </span>
              </span>
            </span>
          </Link>
        )}
      </div>
    </section>
  );
}
