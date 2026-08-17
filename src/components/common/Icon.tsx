import type { SVGProps } from 'react';

/**
 * Единая иконочная система: линейные SVG, толщина 1.5, размер по умолчанию 20.
 * Никаких эмодзи в интерфейсе и никаких иконочных шрифтов.
 *
 * Иконки декоративны: aria-hidden по умолчанию. Если иконка — единственное
 * содержимое кнопки, подпись даёт aria-label самой кнопки (см. IconButton).
 */

export type IconName =
  | 'search'
  | 'heart'
  | 'heart-filled'
  | 'user'
  | 'cart'
  | 'menu'
  | 'close'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-left'
  | 'arrow-right'
  | 'filter'
  | 'check'
  | 'minus'
  | 'plus'
  | 'trash'
  | 'zoom'
  | 'info'
  | 'alert'
  | 'truck'
  | 'card'
  | 'package'
  | 'ruler'
  | 'weight'
  | 'pin'
  | 'sparkle'
  | 'external';

const paths: Record<IconName, React.ReactNode> = {
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4 4" />
    </>
  ),
  heart: (
    <path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7.5 3C19.5 15.4 12 20 12 20Z" />
  ),
  'heart-filled': (
    <path
      d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7.5 3C19.5 15.4 12 20 12 20Z"
      fill="currentColor"
    />
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.9-3.4 3.6-5.2 7-5.2s6.1 1.8 7 5.2" />
    </>
  ),
  cart: (
    <>
      <path d="M3.5 4.5h2.2l2.1 9.6a1.6 1.6 0 0 0 1.6 1.3h7.5a1.6 1.6 0 0 0 1.6-1.2l1.4-6.1H6.4" />
      <circle cx="10" cy="19.2" r="1.3" />
      <circle cx="17" cy="19.2" r="1.3" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  'chevron-down': <path d="m6 9.5 6 6 6-6" />,
  'chevron-right': <path d="m9.5 6 6 6-6 6" />,
  'chevron-left': <path d="m14.5 6-6 6 6 6" />,
  'arrow-right': <path d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5" />,
  filter: (
    <>
      <path d="M4 7h16M7 12h10M10 17h4" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  minus: <path d="M6 12h12" />,
  plus: <path d="M12 6v12M6 12h12" />,
  trash: (
    <>
      <path d="M4.5 7h15M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7" />
      <path d="M6.5 7.5 7.4 19a1.4 1.4 0 0 0 1.4 1.3h6.4a1.4 1.4 0 0 0 1.4-1.3L17.5 7.5" />
      <path d="M10.5 11v5.5M13.5 11v5.5" />
    </>
  ),
  zoom: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4 4M8 10.5h5M10.5 8v5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.9" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V13" />
      <circle cx="12" cy="16.2" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  truck: (
    <>
      <path d="M3 7.5h10.5v9H3zM13.5 10.5h3.8l2.7 3v3h-6.5z" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="16.5" cy="18" r="1.6" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3 10h18M6.5 14.5h3" />
    </>
  ),
  package: (
    <>
      <path d="m12 3.5 8 4.2v8.6l-8 4.2-8-4.2V7.7z" />
      <path d="m4 7.7 8 4.3 8-4.3M12 12v8.5" />
    </>
  ),
  ruler: (
    <>
      <rect x="2.5" y="8.5" width="19" height="7" rx="1.5" />
      <path d="M7 8.5v3M11 8.5v4.5M15 8.5v3M19 8.5v4.5" />
    </>
  ),
  weight: (
    <>
      <path d="M6 9h12l1.5 10.5h-15z" />
      <circle cx="12" cy="6" r="2.2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6-5.6 6-10a6 6 0 1 0-12 0c0 4.4 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2.3" />
    </>
  ),
  sparkle: (
    <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9z" />
  ),
  external: (
    <>
      <path d="M14 4.5h5.5V10" />
      <path d="M19.5 4.5 11 13" />
      <path d="M18 14.5v4a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6h4" />
    </>
  ),
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
