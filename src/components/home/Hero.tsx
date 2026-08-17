import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types';
import { ButtonLink } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { formatPrice } from '@/lib/format';

/**
 * Первый экран (п.11.2 ТЗ).
 *
 * Не рекламный баннер: слева — сообщение и два CTA, справа — редакционная
 * композиция из реальных карточек каталога. Фотографии кликабельны и ведут
 * на конкретные экземпляры, то есть первый экран уже начинает выбор.
 */
export function Hero({ products }: { products: Product[] }) {
  const [lead, second, third] = products;

  return (
    <section className="container-page pt-8 lg:pt-14" aria-labelledby="hero-title">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
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

        {/* редакционная сетка: один крупный экземпляр и два поменьше */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {lead && <HeroTile product={lead} className="col-span-2 aspect-16/10" priority />}
          {second && <HeroTile product={second} className="aspect-square" />}
          {third && <HeroTile product={third} className="aspect-square" />}
        </div>
      </div>
    </section>
  );
}

function HeroTile({
  product,
  className,
  priority,
}: {
  product: Product;
  className: string;
  priority?: boolean;
}) {
  const origin = [product.region, product.country].filter(Boolean).join(', ');

  return (
    <Link
      href={`/product/${product.slug}`}
      className={`group relative overflow-hidden rounded-[var(--radius-md)] bg-surface-strong ${className}`}
    >
      {product.images[0] && (
        <Image
          src={product.images[0].url}
          alt={product.images[0].alt || product.name}
          fill
          sizes="(min-width: 1024px) 40vw, 50vw"
          priority={priority}
          className="object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease)] group-hover:scale-[1.03]"
        />
      )}
      {/* градиент только снизу — подпись должна читаться, но фото остаётся главным */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/75 to-transparent p-3 pt-10 sm:p-4 sm:pt-12">
        <p className="text-[15px] font-medium leading-tight text-white">{product.name}</p>
        <p className="mt-0.5 flex items-center gap-2 text-[13px] text-white/80">
          {origin && <span className="truncate">{origin}</span>}
          <span className="tnum ml-auto shrink-0 font-medium text-white">
            {formatPrice(product.price)}
          </span>
        </p>
      </div>
    </Link>
  );
}
