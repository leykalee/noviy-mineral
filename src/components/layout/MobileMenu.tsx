'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/common/Icon';
import { Portal } from '@/components/common/Portal';
import { primaryNav } from '@/config/navigation';
import type { MegaMenuColumn } from '@/config/navigation';
import { cx } from '@/lib/cx';

/**
 * Мобильное меню: drawer с drill-down по каталогу (п.53 ТЗ).
 *
 * Первый уровень — разделы, второй — ссылки внутри раздела.
 * Фокус запирается внутри панели, Escape закрывает.
 */
export function MobileMenu({ columns }: { columns: MegaMenuColumn[] }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setSection(null);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      // запираем фокус внутри панели
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
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
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  const activeSection = columns.find((c) => c.title === section);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Открыть меню"
        aria-expanded={open}
        className="grid size-11 place-items-center rounded-[var(--radius-sm)] text-foreground hover:bg-muted lg:hidden"
      >
        <Icon name="menu" size={24} />
      </button>

      {open && (
        <Portal>
          <div className="fixed inset-0 z-[100] lg:hidden">
          <div
            className="animate-fade-in absolute inset-0 bg-foreground/40"
            onClick={close}
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Меню"
            className="animate-pop-in absolute inset-y-0 left-0 flex w-[min(400px,88vw)] flex-col bg-white"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
              {activeSection ? (
                <button
                  type="button"
                  onClick={() => setSection(null)}
                  className="inline-flex items-center gap-1.5 text-[15px] font-medium"
                >
                  <Icon name="chevron-left" size={20} />
                  {activeSection.title}
                </button>
              ) : (
                <span className="text-[15px] font-semibold">Меню</span>
              )}
              <button
                type="button"
                onClick={close}
                aria-label="Закрыть меню"
                className="grid size-11 place-items-center rounded-[var(--radius-sm)] hover:bg-muted"
              >
                <Icon name="close" size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scroll-thin">
              {activeSection ? (
                <ul className="p-2">
                  {/* без этого пункта раздел целиком открыть было нельзя —
                      только отдельные подкатегории */}
                  {activeSection.allLink && (
                    <li>
                      <Link
                        href={activeSection.allLink.href}
                        onClick={close}
                        className="mb-1 flex items-center justify-between gap-2 rounded-[var(--radius-sm)] bg-brand-soft px-3 py-3 text-[16px] font-medium text-brand"
                      >
                        {activeSection.allLink.label}
                        <Icon name="arrow-right" size={20} />
                      </Link>
                    </li>
                  )}
                  {activeSection.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        onClick={close}
                        className="block rounded-[var(--radius-sm)] px-3 py-3 text-[16px] hover:bg-brand-soft"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  <ul className="border-b border-border p-2">
                    {columns.map((column) => (
                      <li key={column.title}>
                        <button
                          type="button"
                          onClick={() => setSection(column.title)}
                          className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-3 py-3 text-left text-[16px] font-medium hover:bg-brand-soft"
                        >
                          {column.title}
                          <Icon name="chevron-right" size={20} className="text-muted-foreground" />
                        </button>
                      </li>
                    ))}
                    <li>
                      <Link
                        href="/catalog"
                        onClick={close}
                        className="flex items-center justify-between rounded-[var(--radius-sm)] px-3 py-3 text-[16px] font-medium text-brand hover:bg-brand-soft"
                      >
                        Весь каталог
                        <Icon name="arrow-right" size={20} />
                      </Link>
                    </li>
                  </ul>
                  <ul className="p-2">
                    {primaryNav.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          onClick={close}
                          className={cx(
                            'block rounded-[var(--radius-sm)] px-3 py-3 text-[16px] hover:bg-brand-soft',
                          )}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link
                        href="/account"
                        onClick={close}
                        className="block rounded-[var(--radius-sm)] px-3 py-3 text-[16px] hover:bg-brand-soft"
                      >
                        Личный кабинет
                      </Link>
                    </li>
                  </ul>
                </>
              )}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
