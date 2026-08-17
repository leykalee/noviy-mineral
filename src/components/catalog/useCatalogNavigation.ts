'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useTransition } from 'react';
import type { CatalogQuery } from '@/types';
import { buildSearchParams, parseCatalogQuery } from '@/lib/catalog-query';

/**
 * Состояние каталога читается из URL и туда же записывается.
 *
 * Другого хранилища у фильтров нет — поэтому Back/Forward и обновление страницы
 * работают сами собой (п.20 ТЗ). `useTransition` даёт понять, что выдача
 * перезагружается, не блокируя интерфейс.
 */
export function useCatalogNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const query = useMemo<CatalogQuery>(
    () => parseCatalogQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const apply = useCallback(
    (next: CatalogQuery, options: { scroll?: boolean } = {}) => {
      const params = buildSearchParams(next);
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: options.scroll ?? false });
      });
    },
    [pathname, router],
  );

  /** Любое изменение фильтра возвращает на первую страницу */
  const patch = useCallback(
    (changes: Partial<CatalogQuery>) => apply({ ...query, ...changes, page: undefined }),
    [apply, query],
  );

  return { query, apply, patch, pathname, pending };
}
