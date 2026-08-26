'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';
import type { HeroSlide } from '@/lib/repository';
import { cx } from '@/lib/cx';

/**
 * Первый экран — тёмная карусель разделов каталога.
 *
 * Оформление по образцу rusmineral.ru: чёрное поле, один крупный снимок,
 * крупный набранный прописными заголовок раздела и точки переключения сверху.
 * Тёмный фон здесь работает: минерал на чёрном читается как экспонат
 * в витрине, а не как товар на полке.
 *
 * Отдельного блока с плитками разделов на главной нет — слайдер уже
 * выполняет эту роль.
 */

const INTERVAL = 6000;

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/** Уважаем системную настройку: при отключённой анимации слайды не листаются сами */
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );
}

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();

  const count = slides.length;
  const autoplay = count > 1 && !paused && !reducedMotion;

  useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => setActive((current) => (current + 1) % count), INTERVAL);
    return () => clearInterval(timer);
  }, [autoplay, count]);

  if (count === 0) return null;

  const go = (next: number) => setActive((next + count) % count);

  return (
    <section
      aria-roledescription="карусель"
      aria-label="Разделы каталога"
      className="relative bg-[#0b1112] text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') go(active - 1);
        if (event.key === 'ArrowRight') go(active + 1);
      }}
    >
      {count > 1 && (
        <div className="container-page flex justify-center gap-3 pt-5 pb-4">
          {slides.map((slide, index) => (
            <button
              key={slide.slug}
              type="button"
              onClick={() => go(index)}
              aria-label={`Раздел «${slide.name}»`}
              aria-current={index === active ? 'true' : undefined}
              // сама точка небольшая, а нажимаемая область — 44 px, как у прочих целей
              className="group grid size-11 place-items-center focus-visible:outline-none"
            >
              <span
                className={cx(
                  'block size-2.5 rounded-full border transition-colors duration-[var(--dur)]',
                  index === active
                    ? 'border-white bg-white'
                    : 'border-white/45 bg-transparent group-hover:border-white group-focus-visible:border-white',
                )}
              />
            </button>
          ))}
        </div>
      )}

      <div className="relative h-[68svh] max-h-[720px] min-h-[420px] w-full overflow-hidden">
        {slides.map((slide, index) => {
          const isActive = index === active;
          return (
            <Link
              key={slide.slug}
              href={`/catalog/${slide.slug}`}
              tabIndex={isActive ? undefined : -1}
              aria-hidden={isActive ? undefined : true}
              className={cx(
                'group absolute inset-0 block transition-opacity duration-[600ms] ease-[var(--ease)]',
                isActive ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
            >
              <Image
                src={slide.image.url}
                alt=""
                fill
                sizes="100vw"
                priority={index === 0}
                className="object-cover"
              />

              {/* затемнение с виньеткой: снимок остаётся виден, заголовок читается на любом кадре */}
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(11,17,18,0.35)_0%,rgba(11,17,18,0.78)_70%,rgba(11,17,18,0.92)_100%)]"
              />

              <span className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                <span className="max-w-[14ch] text-balance text-[38px] font-semibold uppercase leading-[1.02] tracking-[0.03em] sm:text-[58px] lg:text-[78px]">
                  {slide.title}
                </span>
                <span className="mt-6 inline-flex items-center gap-2 border-b border-white/35 pb-1 text-[13px] font-medium uppercase tracking-[0.22em] text-white/85 transition-colors duration-[var(--dur)] group-hover:border-white group-hover:text-white">
                  Смотреть каталог
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
