import type { Order } from '@/types';

/**
 * Уведомления покупателю (п.40 ТЗ).
 * Обязательный канал по брифу — email. Telegram и складские системы
 * сознательно не реализуются в MVP, но интерфейс это не запрещает расширить.
 */
export interface EmailProvider {
  readonly id: string;
  readonly isLive: boolean;

  sendOrderCreated(order: Order): Promise<void>;
  sendPaymentConfirmed(order: Order): Promise<void>;
  sendOrderShipped(order: Order, trackingNumber: string): Promise<void>;
}
