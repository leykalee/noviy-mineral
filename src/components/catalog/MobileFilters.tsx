'use client';

import { useEffect, useRef, useState } from 'react';
import type { CatalogFacets } from '@/types';
import { Icon } from '@/components/common/Icon';
import { Filters } from '@/components/catalog/Filters';
import { useCatalogNavigation } from '@/components/catalog/useCatalogNavigation';
import { clearedFilters, hasActiveFilters } from '@/lib/catalog-query';
import { productsCountLabel } from '@/lib/format';

/**
 * Фильтры на мобильных (п.19 ТЗ): кнопка «Фильтры» открывает полноэкранную панель,
 * внизу — «Показать N товаров» с актуальным числом.
 *
 * Число берётся из уже применённой выдачи: фильтр применяется сразу при выборе,
 * поэтому счётчик на кнопке всегда честный.
 */
export function MobileFilters({ facets, total }: { facets: CatalogFacets; total: number }) {
  const [open, setOpen] = useState(false);
  const { query, apply } = useCatalogNavigation();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const activeCount =
    (query.mineral?.length ?? 0) +
    (query.color?.length ?? 0) +
    (query.country?.length ?? 0) +
    (query.region?.length ?? 0) +
    (query.deposit?.length ?? 0) +
    (query.feature?.length ?? 0) +
    (query.priceFrom != null || query.priceTo != null ? 1 : 0) +
    (query.sizeFrom != null || query.sizeTo != null ? 1 : 0) +
    (query.weightFrom != null || query.weightTo != null ? 1 : 0) +
    (query.inStock ? 1 : 0) +
    (query.isNew ? 1 : 0) +
    (query.onSale ? 1 : 0);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-border-strong px-4 text-[15px] font-medium transition-colors duration-[var(--dur-fast)] hover:border-brand hover:text-brand lg:hidden"
      >
        <Icon name="filter" size={18} />
        Фильтры
        {activeCount > 0 && (
          <span className="tnum grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[12px] font-semibold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div
            className="animate-fade-in absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Фильтры"
            className="animate-sheet-up absolute inset-x-0 bottom-0 top-12 flex flex-col rounded-t-[var(--radius-lg)] bg-white shadow-[var(--shadow-sheet)]"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
              <h2 className="text-[16px] font-semibold">Фильтры</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Закрыть фильтры"
                className="grid size-11 place-items-center rounded-[var(--radius-sm)] hover:bg-muted"
              >
                <Icon name="close" size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 scroll-thin">
              <Filters facets={facets} />
            </div>

            <div className="safe-bottom shrink-0 border-t border-border bg-white px-4 pt-3">
              <div className="flex gap-2">
                {hasActiveFilters(query) && (
                  <button
                    type="button"
                    onClick={() => apply(clearedFilters(query))}
                    className="h-12 shrink-0 rounded-[var(--radius-sm)] border border-border-strong px-4 text-[15px] font-medium"
                  >
                    Сбросить
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-12 flex-1 rounded-[var(--radius-sm)] bg-brand text-[15px] font-medium text-white transition-colors duration-[var(--dur-fast)] hover:bg-brand-hover"
                >
                  {total > 0 ? `Показать ${productsCountLabel(total)}` : 'Ничего не найдено'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
