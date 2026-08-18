'use client';

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

/**
 * Переносит содержимое в конец <body>.
 *
 * Нужен для полноэкранных слоёв внутри шапки: у <header> задан backdrop-filter,
 * а элемент с backdrop-filter становится containing block для position: fixed —
 * из-за этого оверлей обрезался по высоте шапки вместо всего экрана.
 */

/** Слой не подписан на внешние изменения — достаточно пустой отписки */
const noopSubscribe = () => () => {};

export function Portal({ children }: { children: React.ReactNode }) {
  // на сервере document нет, поэтому портал появляется только после гидрации
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  if (!mounted) return null;
  return createPortal(children, document.body);
}
