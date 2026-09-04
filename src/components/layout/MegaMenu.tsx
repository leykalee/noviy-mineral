'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from '@/components/common/Icon';
import { Portal } from '@/components/common/Portal';
import type { MegaMenuColumn } from '@/config/navigation';
import { cx } from '@/lib/cx';

/**
 * Каталог в шапке: раскрывается в панель с колонками по смысловым группам.
 *
 * Открывается по клику (не по hover — hover-only недоступен с клавиатуры),
 * закрывается по Escape, клику вне и переходу по ссылке.
 */
export function MegaMenu({ columns }: { columns: MegaMenuColumn[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className={cx(
          'inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] px-4 text-[15px] font-medium transition-colors duration-[var(--dur-fast)]',
          open ? 'bg-brand text-white' : 'bg-brand text-white hover:bg-brand-hover',
        )}
      >
        <Icon name={open ? 'close' : 'menu'} size={18} />
        Каталог
      </button>

      {open && (
        <>
          {/*
            Затемнение только подсвечивает панель и НЕ перехватывает клики:
            иначе первый клик по странице уходил в оверлей и просто закрывал меню,
            а кнопка под курсором не срабатывала. Закрытие обеспечивает
            обработчик mousedown на document.
          */}
          <Portal>
            <div
              className="animate-fade-in pointer-events-none fixed inset-0 top-[var(--header-h)] z-30 bg-foreground/20"
              aria-hidden="true"
            />
          </Portal>
          <div
            id={panelId}
            className="animate-pop-in absolute left-0 top-[calc(100%+10px)] z-40 w-[min(1100px,calc(100vw-64px))] rounded-[var(--radius-md)] border border-border bg-white p-7 shadow-[var(--shadow-pop)]"
          >
            <div className="grid grid-cols-2 gap-x-8 gap-y-7 lg:grid-cols-5">
              {columns.map((column) => (
                <nav key={column.title} aria-label={column.title}>
                  <h3 className="mb-3 border-b border-border pb-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    {column.title}
                  </h3>
                  <ul className="space-y-0.5">
                    {column.allLink && (
                      <li>
                        <Link
                          href={column.allLink.href}
                          onClick={() => setOpen(false)}
                          className="block rounded-[var(--radius-xs)] px-2 py-1.5 text-[15px] font-medium text-brand transition-colors duration-[var(--dur-fast)] hover:bg-brand-soft"
                        >
                          {column.allLink.label}
                        </Link>
                      </li>
                    )}
                    {column.links.map((link) => (
                      <li key={link.href + link.label}>
                        <Link
                          href={link.href}
                          onClick={() => setOpen(false)}
                          className="block rounded-[var(--radius-xs)] px-2 py-1.5 text-[15px] text-foreground transition-colors duration-[var(--dur-fast)] hover:bg-brand-soft hover:text-brand"
                        >
                          {link.label}
                          {link.hint && (
                            <span className="mt-0.5 block text-[12px] text-muted-foreground">
                              {link.hint}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-4">
              <Link
                href="/catalog"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1.5 text-[15px] font-medium text-brand hover:underline"
              >
                Весь каталог
                <Icon name="arrow-right" size={17} />
              </Link>
              <Link
                href="/catalog?inStock=1&sort=price_asc"
                onClick={() => setOpen(false)}
                className="text-[14px] text-muted-foreground hover:text-brand"
              >
                Недорогие экземпляры
              </Link>
              <Link
                href="/catalog?feature=phantom"
                onClick={() => setOpen(false)}
                className="text-[14px] text-muted-foreground hover:text-brand"
              >
                Фантомы и зональность
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
