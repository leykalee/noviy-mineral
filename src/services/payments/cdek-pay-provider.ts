import type {
  CreatePaymentRequest,
  PaymentMethod,
  PaymentProvider,
  PaymentResult,
} from './types';

/**
 * Интеграционный слой CDEK PAY (п.39 ТЗ).
 *
 * Контракт готов, боевые вызовы включаются после получения ключей.
 * Ключи живут только в переменных окружения на сервере и никогда
 * не попадают во frontend-бандл.
 */

/** Базовый адрес API. Используется, когда будут подключены боевые вызовы. */
export const CDEK_PAY_API_BASE = process.env.CDEK_PAY_API_BASE ?? 'https://api.cdekpay.ru';

export class CdekPayProvider implements PaymentProvider {
  readonly id = 'cdek_pay';
  readonly name = 'CDEK PAY';
  readonly isLive = true;

  constructor(
    private readonly merchantId: string,
    private readonly secretKey: string,
  ) {}

  async getMethods(): Promise<PaymentMethod[]> {
    return [{ id: 'cdek_pay_card', name: 'Оплата картой (CDEK PAY)', enabled: true }];
  }

  async createPayment(_request: CreatePaymentRequest): Promise<PaymentResult> {
    // POST /payment — тело и подпись формируются по актуальной документации CDEK PAY
    throw new Error('CDEK PAY не подключён: нужны боевые merchant id и секретный ключ.');
  }

  async getPaymentStatus(_paymentId: string): Promise<PaymentResult> {
    // GET /payment/{id}
    throw new Error('CDEK PAY не подключён: нужны боевые merchant id и секретный ключ.');
  }

  /** Проверка подписи webhook-уведомления от платёжной системы */
  verifyWebhookSignature(_payload: string, _signature: string): boolean {
    throw new Error('Проверка подписи CDEK PAY не настроена: нужен секретный ключ.');
  }
}
