import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/cx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'quiet' | 'inverse';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-sm)] ' +
  'transition-colors duration-[var(--dur-fast)] ' +
  'disabled:opacity-45 disabled:cursor-not-allowed select-none';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover active:bg-brand-active',
  secondary:
    'bg-white text-foreground border border-border-strong hover:border-brand hover:text-brand',
  ghost: 'bg-brand-soft text-brand hover:bg-brand-soft-hover',
  quiet: 'text-brand hover:bg-brand-soft',
  // для тёмных брендовых подложек: переопределять bg/text через className нельзя —
  // конфликт утилит Tailwind разрешается порядком в CSS, а не в атрибуте
  inverse: 'bg-white text-brand hover:bg-white/90 active:bg-white/80',
};

// минимум 44px по высоте для основных размеров — требование к тач-целям
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[14px]',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-13 px-7 text-[16px]',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  children,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  href,
  children,
  ...rest
}: CommonProps & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  return (
    <Link
      href={href}
      className={cx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...rest}
    >
      {children}
    </Link>
  );
}
