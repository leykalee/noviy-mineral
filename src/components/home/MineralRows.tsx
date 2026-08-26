import Link from 'next/link';
import { ProductCard } from '@/components/catalog/ProductCard';
import { Icon } from '@/components/common/Icon';
import type { MineralShowcase } from '@/lib/repository';

/**
 * Ленты по минеральным видам: аметист, флюорит, пирит — каждый своим рядом.
 *
 * Так устроен выбор у коллекционера: он приходит за видом, а не за
 * «изделием из камня», и хочет сравнить несколько экземпляров одного вида
 * между собой — по размеру, огранке и цене.
 *
 * Формула стоит рядом с названием: она однозначно определяет вид там, где
 * бытовое название размыто (горный хрусталь, цитрин и аметист — всё кварц).
 */
export function MineralRows({ showcases }: { showcases: MineralShowcase[] }) {
  if (showcases.length === 0) return null;

  return (
    <div className="space-y-14 lg:space-y-16">
      {showcases.map((showcase) => (
        <section key={showcase.mineral.id} aria-labelledby={`mineral-${showcase.mineral.slug}`}>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 lg:mb-6">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3
                id={`mineral-${showcase.mineral.slug}`}
                className="text-[22px] font-semibold tracking-[-0.01em] sm:text-[24px]"
              >
                {showcase.mineral.name}
              </h3>
              {showcase.mineral.formula && (
                <span className="rounded-[var(--radius-xs)] bg-surface px-2 py-0.5 text-[14px] text-muted-foreground">
                  {showcase.mineral.formula}
                </span>
              )}
            </div>

            <Link
              href={`/catalog?mineral=${showcase.mineral.slug}`}
              className="inline-flex items-center gap-1.5 text-[15px] font-medium text-brand transition-colors duration-[var(--dur-fast)] hover:text-brand-hover"
            >
              {`Все экземпляры (${showcase.total})`}
              <Icon name="arrow-right" size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
            {showcase.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
