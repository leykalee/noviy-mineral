import type {
  CreatePaymentRequest,
  PaymentMethod,
  PaymentProvider,
  PaymentResult,
} from './types';

/**
 * Демонстрационный провайдер оплаты.
 *
 * Никакой имитации успешной оплаты (п.37 ТЗ): платёж всегда остаётся в статусе
 * `pending`, и покупателю показывается настоящее состояние — «ожидает оплаты»,
 * а не «оплата прошла успешно».
 */
export class DemoPaymentProvider implements PaymentProvider {
  readonly id = 'demo';
  readonly name = 'Демонстрационная оплата';
  readonly isLive = false;

  async getMethods(): Promise<PaymentMethod[]> {
    return [
      {
        id: 'online',
        name: 'Онлайн-оплата картой',
        hint: 'Платёжный шлюз ещё не подключён — заказ будет создан без оплаты.',
        enabled: true,
      },
      {
        id: 'on_delivery',
        name: 'Оплата при получении',
        hint: 'Доступность уточняется у магазина.',
        enabled: false,
      },
    ];
  }

  async createPayment(request: CreatePaymentRequest): Promise<PaymentResult> {
    return {
      paymentId: `demo-${request.orderNumber}`,
      state: 'pending',
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentResult> {
    return { paymentId, state: 'pending' };
  }
}
