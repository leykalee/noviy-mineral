/**
 * Слой доставки (п.38 ТЗ).
 *
 * Ответственность строго отделена от оплаты: DeliveryProvider ничего не знает
 * о платежах, PaymentProvider — о пунктах выдачи.
 */

export interface DeliveryAddressInput {
  city: string;
  postalCode?: string;
  street?: string;
}

export interface DeliveryPackage {
  /** Итоговый вес заказа, г */
  weight: number;
  /** Габариты упаковки, см */
  length?: number;
  width?: number;
  height?: number;
  /** Объявленная ценность, руб. */
  declaredValue: number;
}

export type DeliveryMethodKind = 'pickup_point' | 'courier';

export interface DeliveryOption {
  id: string;
  name: string;
  kind: DeliveryMethodKind;
  /** Стоимость, руб. null — если тариф неизвестен без выбора ПВЗ */
  price: number | null;
  /** Срок в днях */
  minDays: number;
  maxDays: number;
  /** Требуется выбрать пункт выдачи */
  requiresPickupPoint: boolean;
}

export interface PickupPoint {
  code: string;
  name: string;
  address: string;
  workTime?: string;
  /** Есть ли примерка/вскрытие — у СДЭК бывает важно */
  hasCashless?: boolean;
}

export interface ShipmentRequest {
  orderNumber: string;
  recipient: { name: string; phone: string; email: string };
  address: DeliveryAddressInput;
  methodId: string;
  pickupPointCode?: string;
  parcel: DeliveryPackage;
}

export interface ShipmentResult {
  /** Номер накладной */
  trackingNumber: string;
  /** Ссылка на отслеживание, если провайдер её даёт */
  trackingUrl?: string;
}

export interface DeliveryProvider {
  readonly id: string;
  readonly name: string;
  /** true — работает с реальным API, false — демонстрационные данные */
  readonly isLive: boolean;

  calculate(address: DeliveryAddressInput, parcel: DeliveryPackage): Promise<DeliveryOption[]>;
  getPickupPoints(city: string): Promise<PickupPoint[]>;
  createShipment(request: ShipmentRequest): Promise<ShipmentResult>;
}
