import Image from 'next/image';
import Link from 'next/link';
import type { Category } from '@/types';
import { productsCountLabel } from '@/lib/format';

/**
 * Крупные визуальные категории (п.12 ТЗ).
 *
 * Фотография доминирует, подпись короткая — название и счётчик, без описаний.
 * Первая плитка шире остальных, чтобы сетка не читалась как «ещё десять
 * одинаковых карточек».
 */
export function CategoryTiles({
  items,
}: {
  items: { category: Category; count: number }[];
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
      {items.map(({ category, count }, index) => (
        <li
          key={category.id}
          className={index === 0 ? 'col-span-2 lg:col-span-3 lg:row-span-2' : 'lg:col-span-3'}
        >
          <Link
            href={`/catalog/${category.slug}`}
            className="group relative block h-full overflow-hidden rounded-[var(--radius-md)] bg-surface-strong"
          >
            <div className={index === 0 ? 'aspect-4/3 lg:aspect-16/13' : 'aspect-4/3 lg:aspect-21/9'}>
              {category.image && (
                <Image
                  src={category.image.url}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 50vw, 50vw"
                  className="object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease)] group-hover:scale-[1.03]"
                />
              )}
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 to-transparent p-4 pt-14">
              <h3
                className={
                  index === 0
                    ? 'text-[20px] font-semibold text-white sm:text-[24px]'
                    : 'text-[17px] font-semibold text-white'
                }
              >
                {category.name}
              </h3>
              {count > 0 && (
                <p className="tnum mt-0.5 text-[13px] text-white/75">{productsCountLabel(count)}</p>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
