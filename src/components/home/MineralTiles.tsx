import Image from 'next/image';
import Link from 'next/link';
import type { Mineral } from '@/types';
import { pluralize } from '@/lib/format';

/**
 * «Популярные минералы» (п.15 ТЗ) — вход в каталог для коллекционера.
 * Только фотография и название вида. Никаких «свойств» и эзотерики.
 */
export function MineralTiles({ items }: { items: { mineral: Mineral; count: number }[] }) {
  return (
    <ul className="grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-6">
      {items.map(({ mineral, count }) => (
        <li key={mineral.id}>
          <Link href={`/catalog?mineral=${mineral.slug}`} className="group block">
            <div className="relative aspect-square overflow-hidden rounded-full bg-surface-strong">
              {mineral.image ? (
                <Image
                  src={mineral.image.url}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 160px, 30vw"
                  className="object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease)] group-hover:scale-[1.05]"
                />
              ) : (
                <div className="grid h-full place-items-center text-[24px] font-semibold text-muted-foreground">
                  {mineral.name.slice(0, 1)}
                </div>
              )}
            </div>
            <p className="mt-2.5 text-center text-[15px] font-medium transition-colors duration-[var(--dur-fast)] group-hover:text-brand">
              {mineral.name}
            </p>
            {count > 0 && (
              <p className="tnum text-center text-[13px] text-muted-foreground">
                {count} {pluralize(count, 'экземпляр', 'экземпляра', 'экземпляров')}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
