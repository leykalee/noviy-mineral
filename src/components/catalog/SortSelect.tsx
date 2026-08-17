'use client';

import type { SortKey } from '@/types';
import { Icon } from '@/components/common/Icon';
import { useCatalogNavigation } from '@/components/catalog/useCatalogNavigation';
import { DEFAULT_SORT, SORT_KEYS, sortLabels } from '@/lib/catalog-query';

/** Сортировка (п.21 ТЗ). Все варианты реально применяются на сервере. */
export function SortSelect() {
  const { query, apply } = useCatalogNavigation();
  const value = query.sort ?? DEFAULT_SORT;

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only-focusable absolute">Сортировка</span>
      <select
        value={value}
        onChange={(e) => apply({ ...query, sort: e.target.value as SortKey, page: undefined })}
        className="h-11 appearance-none rounded-[var(--radius-sm)] border border-border-strong bg-white pl-3.5 pr-10 text-[15px] outline-none transition-colors duration-[var(--dur-fast)] hover:border-brand focus:border-brand"
      >
        {SORT_KEYS.map((key) => (
          <option key={key} value={key}>
            {sortLabels[key]}
          </option>
        ))}
      </select>
      <Icon
        name="chevron-down"
        size={18}
        className="pointer-events-none absolute right-3 text-muted-foreground"
      />
    </label>
  );
}
