'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProductImage } from '@/types';
import { Icon } from '@/components/common/Icon';
import { cx } from '@/lib/cx';

/**
 * Галерея товара (п.26 ТЗ).
 *
 * Крупное главное фото, thumbnails, зум по клику и полноэкранный lightbox
 * со стрелками, Escape и запертым фокусом. Изображение — главный элемент
 * страницы, поэтому оно не помещено в декоративную карточку.
 */
export function Gallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  const current = images[index];
  const count = images.length;

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + count) % count),
    [count],
  );

  useEffect(() => {
    if (!lightbox) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLightbox(false);
        openerRef.current?.focus();
      } else if (event.key === 'ArrowRight') {
        go(1);
      } else if (event.key === 'ArrowLeft') {
        go(-1);
      } else if (event.key === 'Tab' && lightboxRef.current) {
        const focusable = lightboxRef.current.querySelectorAll<HTMLElement>('button');
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
      }
    };

    document.addEventListener('keydown', onKeyDown);
    lightboxRef.current?.querySelector('button')?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [lightbox, go]);

  if (!current) {
    return (
      <div className="grid aspect-4/3 place-items-center rounded-[var(--radius-md)] bg-surface-strong text-[15px] text-muted-foreground">
        Фотография скоро появится
      </div>
    );
  }

  return (
    <div>
      <button
        ref={openerRef}
        type="button"
        onClick={() => setLightbox(true)}
        aria-label="Открыть фотографию во весь экран"
        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-[var(--radius-md)] bg-surface-strong"
      >
        <span className="block aspect-4/3">
          <Image
            src={current.url}
            alt={current.alt || name}
            fill
            sizes="(min-width: 1024px) 58vw, 100vw"
            priority
            className="object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease)] group-hover:scale-[1.02]"
          />
        </span>
        <span className="pointer-events-none absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-white/90 text-foreground opacity-0 transition-opacity duration-[var(--dur)] group-hover:opacity-100">
          <Icon name="zoom" size={20} />
        </span>
      </button>

      {count > 1 && (
        <ul className="mt-3 flex gap-2.5 overflow-x-auto pb-1 scroll-thin">
          {images.map((image, i) => (
            <li key={image.url + i}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Фотография ${i + 1} из ${count}`}
                aria-current={i === index}
                className={cx(
                  'relative block size-20 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border-2 transition-colors duration-[var(--dur-fast)] sm:size-24',
                  i === index ? 'border-brand' : 'border-transparent hover:border-border-strong',
                )}
              >
                <Image src={image.url} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {lightbox && (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Фотографии: ${name}`}
          className="animate-fade-in fixed inset-0 z-[200] flex flex-col bg-foreground/95"
        >
          <div className="flex h-14 shrink-0 items-center justify-between px-4 text-white">
            <span className="tnum text-[14px] text-white/70">
              {index + 1} / {count}
            </span>
            <button
              type="button"
              onClick={() => {
                setLightbox(false);
                openerRef.current?.focus();
              }}
              aria-label="Закрыть просмотр"
              className="grid size-11 place-items-center rounded-full hover:bg-white/10"
            >
              <Icon name="close" size={24} />
            </button>
          </div>

          <div className="relative flex-1">
            <Image
              src={current.url}
              alt={current.alt || name}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {count > 1 && (
            <div className="flex h-20 shrink-0 items-center justify-center gap-4 text-white">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Предыдущая фотография"
                className="grid size-12 place-items-center rounded-full border border-white/25 hover:bg-white/10"
              >
                <Icon name="chevron-left" size={24} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Следующая фотография"
                className="grid size-12 place-items-center rounded-full border border-white/25 hover:bg-white/10"
              >
                <Icon name="chevron-right" size={24} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
