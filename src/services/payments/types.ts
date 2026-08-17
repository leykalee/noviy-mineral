/**
 * Слой оплаты (п.39 ТЗ).
 *
 * Отделён от доставки. Провайдер не знает ни о ПВЗ, ни о тарифах —
 * только о сумме, валюте и статусе платежа.
 */

export type PaymentState = 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded';

export interface PaymentMethod {
  id: string;
  name: string;
  /** Описание под названием способа */
  hint?: string;
  /** Способ доступен к выбору */
  enabled: boolean;
}

export interface CreatePaymentRequest {
  orderNumber: string;
  /** Сумма в рублях */
  amount: number;
  methodId: string;
  customer: { email: string; phone: string; name: string };
  /** Куда вернуть покупателя после оплаты */
  returnUrl: string;
}

export interface PaymentResult {
  paymentId: string;
  state: PaymentState;
  /** Ссылка на платёжную форму провайдера, если оплата внешняя */
  confirmationUrl?: string;
  /** Причина отказа, если state = failed */
  failureReason?: string;
}

export interface PaymentProvider {
  readonly id: string;
  readonly name: string;
  /** false → платежи не проводятся, интерфейс обязан сказать об этом честно */
  readonly isLive: boolean;

  getMethods(): Promise<PaymentMethod[]>;
  createPayment(request: CreatePaymentRequest): Promise<PaymentResult>;
  getPaymentStatus(paymentId: string): Promise<PaymentResult>;
}
