import type { Order } from '@/types';
import type { EmailProvider } from './types';

/**
 * Dev-провайдер писем: ничего не отправляет, только пишет в лог сервера.
 * Нужен, чтобы поток оформления заказа был полным и проверяемым до подключения SMTP.
 */
export class DevEmailProvider implements EmailProvider {
  readonly id = 'dev';
  readonly isLive = false;

  private log(subject: string, order: Order): void {
    console.info(
      `[email:dev] «${subject}» → ${order.customer.email} (заказ ${order.number}, ${order.total} ₽). Письмо НЕ отправлено.`,
    );
  }

  async sendOrderCreated(order: Order): Promise<void> {
    this.log('Заказ оформлен', order);
  }

  async sendPaymentConfirmed(order: Order): Promise<void> {
    this.log('Оплата получена', order);
  }

  async sendOrderShipped(order: Order, trackingNumber: string): Promise<void> {
    this.log(`Заказ отправлен, накладная ${trackingNumber}`, order);
  }
}
