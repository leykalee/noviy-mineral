import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types';
import { FavoriteButton } from '@/components/common/FavoriteButton';
import { StatusBadge, Tag } from '@/components/common/StatusBadge';
import { discountPercent, formatPrice } from '@/lib/format';
import { mineralById } from '@/data/demo/taxonomy';
import { cx } from '@/lib/cx';

/**
 * Карточка товара — мини-витрина конкретного экземпляра (п.22 ТЗ).
 *
 * Фотография доминирует и не завёрнута в дополнительную «карточку в карточке»:
 * никакой рамки вокруг всего блока, только изображение + подпись под ним.
 * Выбор количества в каталоге не показываем — экземпляр всё равно один.
 */
export function ProductCard({
  product,
  priority = false,
  sizes = '(min-width: 1280px) 320px, (min-width: 768px) 33vw, 50vw',
}: {
  product: Product;
  /** true для первых карточек первого экрана — они грузятся сразу */
  priority?: boolean;
  sizes?: string;
}) {
  const mineral = product.mineralId ? mineralById.get(product.mineralId) : undefined;
  const origin = [product.region, product.country].filter(Boolean).join(', ');
  const subtitle = origin || mineral?.name || product.material || null;
  const discount = discountPercent(product.price, product.oldPrice);
  const unavailable = product.status !== 'available';
  const secondImage = product.images[1];

  return (
    <article className="group relative flex h-full flex-col">
      <Link href={`/product/${product.slug}`} className="block shrink-0">
        <div
          className={cx(
            'relative aspect-4/3 overflow-hidden rounded-[var(--radius-md)] bg-surface-strong',
            unavailable && 'opacity-90',
          )}
        >
          {product.images[0] ? (
            <>
              <Image
                src={product.images[0].url}
                alt={product.images[0].alt || product.name}
                fill
                sizes={sizes}
                priority={priority}
                className={cx(
                  'object-cover transition-[opacity,transform] duration-[var(--dur-slow)] ease-[var(--ease)]',
                  // при hover либо плавно подменяем фото, либо чуть приближаем — без прыжков
                  secondImage ? 'group-hover:opacity-0' : 'group-hover:scale-[1.03]',
                )}
              />
              {secondImage && (
                <Image
                  src={secondImage.url}
                  alt=""
                  fill
                  sizes={sizes}
                  className="object-cover opacity-0 transition-opacity duration-[var(--dur-slow)] ease-[var(--ease)] group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="grid h-full place-items-center text-[13px] text-muted-foreground">
              Фотография скоро появится
            </div>
          )}

          <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
            {product.isNew && !unavailable && <Tag tone="brand">Новинка</Tag>}
            {discount && <Tag tone="sale">−{discount}%</Tag>}
            {unavailable && <StatusBadge status={product.status} size="sm" />}
          </div>
        </div>
      </Link>

      <FavoriteButton
        productId={product.id}
        productName={product.name}
        className="absolute right-2 top-2"
      />

      {/* высоты строк зафиксированы: иначе у соседних карточек цена оказывается
          на разной высоте, когда название занимает одну строку, а не две */}
      <div className="flex flex-1 flex-col pt-3">
        <Link href={`/product/${product.slug}`} className="block">
          <h3 className="line-clamp-2 min-h-[44px] text-[16px] font-medium leading-snug text-foreground transition-colors duration-[var(--dur-fast)] group-hover:text-brand">
            {product.name}
          </h3>
        </Link>
        <p className="mt-0.5 line-clamp-1 min-h-[20px] text-[14px] text-muted-foreground">
          {subtitle ?? '\u00A0'}
        </p>

        <div className="mt-2 flex items-baseline gap-2">
          <span
            className={cx(
              'tnum text-[17px] font-semibold',
              unavailable ? 'text-muted-foreground' : 'text-foreground',
            )}
          >
            {formatPrice(product.price)}
          </span>
          {product.oldPrice && product.oldPrice > product.price && (
            <span className="tnum text-[14px] text-muted-foreground line-through">
              {formatPrice(product.oldPrice)}
            </span>
          )}
        </div>

        <p className="mt-1 min-h-[18px] text-[13px] text-muted-foreground">
          {product.uniquePiece && product.status === 'available' ? 'Единственный экземпляр' : '\u00A0'}
        </p>
      </div>
    </article>
  );
}

/** Скелетон карточки — держит ту же геометрию, чтобы не было скачка вёрстки */
export function ProductCardSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-4/3 rounded-[var(--radius-md)]" />
      <div className="pt-3 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded-[var(--radius-xs)]" />
        <div className="skeleton h-3.5 w-1/2 rounded-[var(--radius-xs)]" />
        <div className="skeleton h-5 w-24 rounded-[var(--radius-xs)]" />
      </div>
    </div>
  );
}
