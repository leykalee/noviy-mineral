'use client';

import { useId } from 'react';
import { cx } from '@/lib/cx';

/**
 * Поле формы с видимой подписью и ошибкой рядом с полем (а не общим списком сверху).
 * Placeholder никогда не заменяет label.
 */
export function Field({
  label,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode;
  className?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[14px] font-medium">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-[13px] text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClass = (invalid: boolean) =>
  cx(
    'h-12 w-full rounded-[var(--radius-sm)] border bg-white px-3.5 text-[16px] outline-none transition-colors duration-[var(--dur-fast)]',
    invalid ? 'border-danger' : 'border-border-strong focus:border-brand',
  );
