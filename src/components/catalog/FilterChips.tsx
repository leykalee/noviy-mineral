'use client';

import type { CatalogFacets } from '@/types';
import { Icon } from '@/components/common/Icon';
import { useCatalogNavigation } from '@/components/catalog/useCatalogNavigation';
import { clearedFilters, hasActiveFilters, toggleListValue } from '@/lib/catalog-query';
import { formatNumber } from '@/lib/format';

/**
 * Выбранные параметры чипсами (п.19 ТЗ): «Флюорит ×», «до 5 000 ₽ ×» и «Сбросить всё».
 * Подписи берутся из фасетов, чтобы в чипе стояло человеческое название, а не slug.
 */
export function FilterChips({ facets }: { facets: CatalogFacets }) {
  const { query, apply } = useCatalogNavigation();

  if (!hasActiveFilters(query)) return null;

  const labelFrom = (list: { value: string; label: string }[], value: string) =>
    list.find((f) => f.value === value)?.label ?? value;

  type Chip = { key: string; label: string; onRemove: () => void };
  const chips: Chip[] = [];

  const listKeys = [
    ['mineral', facets.mineral],
    ['color', facets.color],
    ['country', facets.country],
    ['region', facets.region],
    ['deposit', facets.deposit],
    ['feature', facets.feature],
  ] as const;

  for (const [key, facetList] of listKeys) {
    for (const value of (query[key] as string[] | undefined) ?? []) {
      chips.push({
        key: `${key}:${value}`,
        label: labelFrom(facetList, value),
        onRemove: () => apply(toggleListValue(query, key, value)),
      });
    }
  }

  if (query.priceFrom != null || query.priceTo != null) {
    const label =
      query.priceFrom != null && query.priceTo != null
        ? `${formatNumber(query.priceFrom)}–${formatNumber(query.priceTo)} ₽`
        : query.priceFrom != null
          ? `от ${formatNumber(query.priceFrom)} ₽`
          : `до ${formatNumber(query.priceTo!)} ₽`;
    chips.push({
      key: 'price',
      label,
      onRemove: () => apply({ ...query, priceFrom: undefined, priceTo: undefined, page: undefined }),
    });
  }

  if (query.sizeFrom != null || query.sizeTo != null) {
    const label =
      query.sizeFrom != null && query.sizeTo != null
        ? `${query.sizeFrom}–${query.sizeTo} мм`
        : query.sizeFrom != null
          ? `от ${query.sizeFrom} мм`
          : `до ${query.sizeTo} мм`;
    chips.push({
      key: 'size',
      label,
      onRemove: () => apply({ ...query, sizeFrom: undefined, sizeTo: undefined, page: undefined }),
    });
  }

  if (query.weightFrom != null || query.weightTo != null) {
    const label =
      query.weightFrom != null && query.weightTo != null
        ? `${query.weightFrom}–${query.weightTo} г`
        : query.weightFrom != null
          ? `от ${query.weightFrom} г`
          : `до ${query.weightTo} г`;
    chips.push({
      key: 'weight',
      label,
      onRemove: () => apply({ ...query, weightFrom: undefined, weightTo: undefined, page: undefined }),
    });
  }

  if (query.inStock) {
    chips.push({
      key: 'inStock',
      label: 'В наличии',
      onRemove: () => apply({ ...query, inStock: undefined, page: undefined }),
    });
  }
  if (query.isNew) {
    chips.push({
      key: 'isNew',
      label: 'Новинки',
      onRemove: () => apply({ ...query, isNew: undefined, page: undefined }),
    });
  }
  if (query.onSale) {
    chips.push({
      key: 'onSale',
      label: 'Со скидкой',
      onRemove: () => apply({ ...query, onSale: undefined, page: undefined }),
    });
  }

  return (
    <ul className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <li key={chip.key}>
          <button
            type="button"
            onClick={chip.onRemove}
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-brand-soft px-3 text-[14px] font-medium text-brand transition-colors duration-[var(--dur-fast)] hover:bg-brand-soft-hover"
          >
            {chip.label}
            <Icon name="close" size={15} aria-hidden="true" />
            <span className="sr-only-focusable absolute">Убрать фильтр</span>
          </button>
        </li>
      ))}
      <li>
        <button
          type="button"
          onClick={() => apply(clearedFilters(query))}
          className="h-9 px-2 text-[14px] font-medium text-muted-foreground underline-offset-2 hover:text-brand hover:underline"
        >
          Сбросить всё
        </button>
      </li>
    </ul>
  );
}
