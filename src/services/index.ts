import 'server-only';

import { CdekDeliveryProvider } from './delivery/cdek-provider';
import { DemoDeliveryProvider } from './delivery/demo-provider';
import type { DeliveryProvider } from './delivery/types';
import { CdekPayProvider } from './payments/cdek-pay-provider';
import { DemoPaymentProvider } from './payments/demo-provider';
import type { PaymentProvider } from './payments/types';
import { DevEmailProvider } from './email/dev-provider';
import { ApiEmailProvider } from './email/smtp-provider';
import type { EmailProvider } from './email/types';

/**
 * Выбор реализаций по переменным окружения.
 *
 * Правило простое: есть боевые credentials — работает боевой провайдер,
 * нет — демонстрационный, и он честно сообщает о себе через `isLive = false`.
 * Никаких ключей во frontend (п.39 ТЗ).
 */

let deliveryProvider: DeliveryProvider | null = null;
let paymentProvider: PaymentProvider | null = null;
let emailProvider: EmailProvider | null = null;

export function getDeliveryProvider(): DeliveryProvider {
  if (deliveryProvider) return deliveryProvider;

  const account = process.env.CDEK_ACCOUNT;
  const password = process.env.CDEK_SECURE_PASSWORD;

  deliveryProvider =
    account && password ? new CdekDeliveryProvider(account, password) : new DemoDeliveryProvider();

  return deliveryProvider;
}

export function getPaymentProvider(): PaymentProvider {
  if (paymentProvider) return paymentProvider;

  const merchantId = process.env.CDEK_PAY_MERCHANT_ID;
  const secretKey = process.env.CDEK_PAY_SECRET_KEY;

  paymentProvider =
    merchantId && secretKey ? new CdekPayProvider(merchantId, secretKey) : new DemoPaymentProvider();

  return paymentProvider;
}

export function getEmailProvider(): EmailProvider {
  if (emailProvider) return emailProvider;

  const endpoint = process.env.EMAIL_API_ENDPOINT;
  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM;

  emailProvider =
    endpoint && apiKey && from
      ? new ApiEmailProvider(endpoint, apiKey, from)
      : new DevEmailProvider();

  return emailProvider;
}
