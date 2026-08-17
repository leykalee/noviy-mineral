import Image from 'next/image';
import Link from 'next/link';
import { brandAssets } from '@/config/brand';
import { storeConfig } from '@/config/store';
import { cx } from '@/lib/cx';

/**
 * Единственная точка, где сайт обращается к логотипу.
 *
 * Знак взят с аватарки сообщества VK и не перерисовывался. Если файл заменят,
 * менять код не придётся — пути лежат в src/config/brand.ts.
 * Если `brandAssets.isRealLogo === false`, компонент показывает текстовый fallback.
 */

interface LogoProps {
  /** Показывать ли шрифтовую часть рядом со знаком */
  withWordmark?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function Logo({ withWordmark = true, size = 'md', className }: LogoProps) {
  const px = size === 'sm' ? 36 : 44;

  return (
    <Link
      href="/"
      className={cx('inline-flex items-center gap-3 group', className)}
      aria-label={`${storeConfig.name} — на главную`}
    >
      {brandAssets.isRealLogo ? (
        <Image
          src={brandAssets.markBadge}
          alt=""
          width={px}
          height={px}
          priority
          className="rounded-[var(--radius-sm)] shrink-0"
        />
      ) : (
        // fallback, если логотип заказчика не получен: аккуратная монограмма, а не выдуманный знак
        <span
          aria-hidden="true"
          className="grid place-items-center rounded-[var(--radius-sm)] bg-brand text-white font-semibold shrink-0"
          style={{ width: px, height: px, fontSize: px * 0.4 }}
        >
          НМ
        </span>
      )}

      {withWordmark && (
        <span className="leading-[1.05]">
          <span
            className={cx(
              'block font-semibold tracking-[0.02em] text-foreground',
              size === 'sm' ? 'text-[15px]' : 'text-[17px]',
            )}
          >
            Новый Минерал
          </span>
          {/* вторая строка съедает ширину шапки на 390 px — показываем с sm */}
          <span className="hidden text-[11px] uppercase tracking-[0.14em] text-muted-foreground sm:block">
            минералы и камень
          </span>
        </span>
      )}
    </Link>
  );
}
