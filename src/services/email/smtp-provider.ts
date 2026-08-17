import type { Order } from '@/types';
import type { EmailProvider } from './types';

/**
 * Боевой провайдер писем через HTTP API рассыльщика.
 *
 * Реализация намеренно оставлена точкой расширения: конкретный сервис
 * (SMTP-шлюз, Unisender, Sendsay и т. п.) выбирает заказчик. Все ключи —
 * только через переменные окружения.
 */
export class ApiEmailProvider implements EmailProvider {
  readonly id = 'api';
  readonly isLive = true;

  constructor(
    private readonly endpoint: string,
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  private async send(to: string, subject: string, html: string): Promise<void> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: this.from, to, subject, html }),
    });
    if (!response.ok) {
      throw new Error(`Не удалось отправить письмо: ${response.status}`);
    }
  }

  private itemsHtml(order: Order): string {
    return order.items
      .map(
        (item) =>
          `<li>${item.name} (${item.sku})${item.quantity > 1 ? ` × ${item.quantity}` : ''} — ${item.price} ₽</li>`,
      )
      .join('');
  }

  async sendOrderCreated(order: Order): Promise<void> {
    await this.send(
      order.customer.email,
      `Заказ ${order.number} оформлен`,
      `<p>Здравствуйте, ${order.customer.name}!</p>
       <p>Мы приняли заказ ${order.number}.</p>
       <ul>${this.itemsHtml(order)}</ul>
       <p>Итого: ${order.total} ₽</p>`,
    );
  }

  async sendPaymentConfirmed(order: Order): Promise<void> {
    await this.send(
      order.customer.email,
      `Оплата заказа ${order.number} получена`,
      `<p>Оплата по заказу ${order.number} получена. Мы готовим отправление.</p>`,
    );
  }

  async sendOrderShipped(order: Order, trackingNumber: string): Promise<void> {
    await this.send(
      order.customer.email,
      `Заказ ${order.number} отправлен`,
      `<p>Заказ ${order.number} передан в доставку.</p>
       <p>Номер накладной: ${trackingNumber}</p>`,
    );
  }
}
