import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/common/Icon';
import type { CatalogSection } from '@/lib/repository';

/**
 * Разделы каталога плитками — первый шаг выбора сразу под первым экраном.
 *
 * Счётчик экземпляров стоит рядом с названием: коллекционеру важно знать
 * ширину выбора до перехода, иначе раздел с тремя позициями выглядит так же
 * весомо, как раздел с сотней.
 */
export function CatalogSections({ sections }: { sections: CatalogSection[] }) {
  if (sections.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-5">
      {sections.map((section) => (
        <li key={section.category.id}>
          <Link
            href={`/catalog/${section.category.slug}`}
            className="group block focus-visible:outline-none"
          >
            <div className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] bg-surface-strong">
              {section.category.image && (
                <Image
                  src={section.category.image.url}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease)] group-hover:scale-[1.04]"
                />
              )}
              {/* тёплая заливка по нижнему краю — держит счётчик читаемым на любом фото */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent"
              />
              <span className="tnum absolute bottom-2.5 left-3 text-[13px] font-medium text-white">
                {section.count}
              </span>
            </div>

            <p className="mt-3 text-[16px] font-medium leading-snug transition-colors duration-[var(--dur-fast)] group-hover:text-brand">
              {section.category.name}
            </p>
            <span className="mt-1 inline-flex items-center gap-1 text-[14px] text-muted-foreground transition-colors duration-[var(--dur-fast)] group-hover:text-brand">
              Смотреть каталог
              <Icon
                name="arrow-right"
                size={15}
                className="transition-transform duration-[var(--dur-fast)] group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
