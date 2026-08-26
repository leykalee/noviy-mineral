import Image from 'next/image';
import type { Product } from '@/types';
import { ButtonLink } from '@/components/common/Button';

/**
 * Крупный блок, разбивающий товарную сетку (п.16 ТЗ).
 *
 * Текст правдив: модель товара действительно поддерживает уникальный экземпляр —
 * у таких товаров `uniquePiece = true` и `stock = 1`, и на странице товара
 * показывается прямое утверждение об этом.
 */
export function Editorial({ product }: { product?: Product }) {
  return (
    <section className="bg-brand text-white" aria-labelledby="editorial-title">
      <div className="container-page grid gap-8 py-14 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-20">
        <div>
          <h2
            id="editorial-title"
            className="text-[30px] font-semibold leading-[1.12] tracking-[-0.015em] sm:text-[38px]"
          >
            Каждый образец — единственный
          </h2>
          <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-white/85">
            Для коллекционных минералов на фотографиях представлен именно тот экземпляр, который
            будет отправлен покупателю. У образца свой артикул, свои размеры и вес — второго
            такого же не будет.
          </p>
          <div className="mt-8">
            <ButtonLink href="/catalog/minerals" size="lg" variant="inverse">
              Смотреть коллекционные минералы
            </ButtonLink>
          </div>
        </div>

        {product?.images[0] && (
          <figure className="relative aspect-4/3 overflow-hidden rounded-[var(--radius-lg)] bg-white/10">
            <Image
              src={product.images[0].url}
              alt={product.images[0].alt || product.name}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-contain"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 to-transparent p-4 pt-12 text-[14px] text-white/90">
              {product.name}
              <span className="tnum ml-2 text-white/70">{product.sku}</span>
            </figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}
