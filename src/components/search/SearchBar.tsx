'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Icon } from '@/components/common/Icon';
import { formatPrice } from '@/lib/format';
import { cx } from '@/lib/cx';

interface Suggestions {
  minerals: { slug: string; name: string }[];
  products: {
    slug: string;
    name: string;
    sku: string;
    price: number;
    image: string | null;
    origin: string | null;
  }[];
  other: { label: string; hint: string; href: string }[];
  total?: number;
}

const empty: Suggestions = { minerals: [], products: [], other: [] };

interface SearchBarProps {
  /** Компактный вариант для мобильной шапки */
  compact?: boolean;
  initialQuery?: string;
  className?: string;
  autoFocus?: boolean;
}

export function SearchBar({ compact, initialQuery = '', className, autoFocus }: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  // храним ответ вместе с запросом, к которому он относится
  const [result, setResult] = useState<{ query: string; data: Suggestions }>({
    query: '',
    data: empty,
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  // подсказки с задержкой, чтобы не дёргать сервер на каждую букву
  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : empty))
        .then((json: Suggestions) => setResult({ query: q, data: json }))
        .catch(() => {
          /* прерванный запрос — не ошибка */
        });
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  const query = value.trim();
  // показываем только те подсказки, что относятся к текущему запросу
  const data = result.query === query ? result.data : empty;
  const loading = query.length >= 2 && result.query !== query;

  // клик вне панели и Escape закрывают её
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const submit = useCallback(
    (event?: React.FormEvent) => {
      event?.preventDefault();
      const q = value.trim();
      if (!q) return;
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(q)}`);
    },
    [router, value],
  );

  const hasResults =
    data.minerals.length > 0 || data.products.length > 0 || data.other.length > 0;
  const showPanel = open && value.trim().length >= 2;

  return (
    <div ref={rootRef} className={cx('relative w-full', className)}>
      <form role="search" onSubmit={submit}>
        <label htmlFor={`${listboxId}-input`} className="sr-only-focusable absolute">
          Поиск по каталогу
        </label>
        <div
          className={cx(
            'flex items-center gap-2 rounded-[var(--radius-sm)] border bg-white transition-colors duration-[var(--dur-fast)]',
            'border-border-strong focus-within:border-brand',
            compact ? 'h-11 px-3' : 'h-12 px-4',
          )}
        >
          <Icon name="search" className="text-muted-foreground shrink-0" />
          <input
            id={`${listboxId}-input`}
            ref={inputRef}
            type="search"
            value={value}
            autoFocus={autoFocus}
            onChange={(e) => {
              setValue(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Минерал, месторождение или артикул"
            autoComplete="off"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listboxId}
            aria-autocomplete="list"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:appearance-none"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                setValue('');
                inputRef.current?.focus();
              }}
              aria-label="Очистить поиск"
              className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <Icon name="close" size={16} />
            </button>
          )}
          {!compact && (
            <button
              type="submit"
              className="h-8 shrink-0 rounded-[var(--radius-xs)] bg-brand px-4 text-[14px] font-medium text-white transition-colors duration-[var(--dur-fast)] hover:bg-brand-hover"
            >
              Найти
            </button>
          )}
        </div>
      </form>

      {showPanel && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Подсказки поиска"
          className="animate-pop-in absolute inset-x-0 top-[calc(100%+8px)] z-50 max-h-[70vh] overflow-y-auto rounded-[var(--radius-md)] border border-border bg-white p-2 shadow-[var(--shadow-pop)] scroll-thin"
        >
          {loading && !hasResults && (
            <div className="space-y-2 p-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-12 rounded-[var(--radius-xs)]" />
              ))}
            </div>
          )}

          {!loading && !hasResults && (
            <p className="px-3 py-4 text-[14px] text-muted-foreground">
              Ничего не нашли. Попробуйте другой запрос — например, «флюорит» или артикул.
            </p>
          )}

          {data.minerals.length > 0 && (
            <section className="mb-1">
              <h3 className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                Минералы
              </h3>
              {data.minerals.map((m) => (
                <Link
                  key={m.slug}
                  href={`/catalog?mineral=${encodeURIComponent(m.slug)}`}
                  onClick={() => setOpen(false)}
                  role="option"
                  aria-selected={false}
                  className="flex items-center gap-2 rounded-[var(--radius-xs)] px-3 py-2 text-[15px] hover:bg-brand-soft"
                >
                  <Icon name="sparkle" size={16} className="text-brand-bright" />
                  {m.name}
                </Link>
              ))}
            </section>
          )}

          {data.products.length > 0 && (
            <section className="mb-1">
              <h3 className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                Товары
              </h3>
              {data.products.map((p) => (
                <Link
                  key={p.slug}
                  href={`/product/${p.slug}`}
                  onClick={() => setOpen(false)}
                  role="option"
                  aria-selected={false}
                  className="flex items-center gap-3 rounded-[var(--radius-xs)] px-3 py-2 hover:bg-brand-soft"
                >
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-[var(--radius-xs)] bg-surface-strong">
                    {p.image && (
                      <Image src={p.image} alt="" fill sizes="44px" className="object-cover" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px]">{p.name}</span>
                    <span className="block truncate text-[13px] text-muted-foreground">
                      {p.origin ?? p.sku}
                    </span>
                  </span>
                  <span className="tnum shrink-0 text-[15px] font-medium">
                    {formatPrice(p.price)}
                  </span>
                </Link>
              ))}
            </section>
          )}

          {data.other.length > 0 && (
            <section>
              <h3 className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                Возможно
              </h3>
              {data.other.map((o) => (
                <Link
                  key={o.href}
                  href={o.href}
                  onClick={() => setOpen(false)}
                  role="option"
                  aria-selected={false}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-xs)] px-3 py-2 text-[15px] hover:bg-brand-soft"
                >
                  <span>{o.label}</span>
                  <span className="shrink-0 text-[13px] text-muted-foreground">{o.hint}</span>
                </Link>
              ))}
            </section>
          )}

          {hasResults && (
            <button
              type="button"
              onClick={() => submit()}
              className="mt-1 flex w-full items-center justify-between gap-2 rounded-[var(--radius-xs)] border-t border-border px-3 py-3 text-[15px] font-medium text-brand hover:bg-brand-soft"
            >
              Показать все результаты
              <Icon name="arrow-right" size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
