import 'server-only';

import type { Order } from '@/types';

/**
 * Хранилище заказов прототипа.
 *
 * ⚠️ Заказы живут в памяти процесса и пропадают при перезапуске сервера.
 * Это осознанная заглушка на время MVP: интерфейс и поток оформления работают
 * целиком, а подключение PostgreSQL сводится к замене трёх функций ниже
 * (схема таблиц уже описана в src/db/schema.ts).
 */

const orders = new Map<string, Order>();

/** Счётчик номеров; в боевой версии его заменит последовательность в БД */
let counter = 100_240;

export function nextOrderNumber(): string {
  counter += 1;
  return `НМ-${counter}`;
}

export function saveOrder(order: Order): void {
  orders.set(order.id, order);
}

export function getOrder(id: string): Order | null {
  return orders.get(id) ?? null;
}

export function getOrderByNumber(number: string): Order | null {
  for (const order of orders.values()) {
    if (order.number === number) return order;
  }
  return null;
}
