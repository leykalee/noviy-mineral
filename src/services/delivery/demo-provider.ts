import type {
  DeliveryAddressInput,
  DeliveryOption,
  DeliveryPackage,
  DeliveryProvider,
  PickupPoint,
  ShipmentRequest,
  ShipmentResult,
} from './types';

/**
 * Демонстрационный провайдер доставки.
 *
 * Используется, пока не заданы credentials СДЭК. Возвращает тестовые данные и
 * ЯВНО помечает себя как не-боевой (`isLive = false`) — интерфейс обязан
 * показать пользователю, что это расчёт-заглушка, а не реальный тариф.
 *
 * Тарифы ниже — вымышленные и не согласованы с заказчиком.
 */

const CITY_PICKUP_POINTS: Record<string, PickupPoint[]> = {
  москва: [
    {
      code: 'DEMO-MSK-01',
      name: 'Пункт выдачи (демо)',
      address: 'Москва, демонстрационный адрес 1',
      workTime: 'Пн–Вс 10:00–21:00',
      hasCashless: true,
    },
    {
      code: 'DEMO-MSK-02',
      name: 'Пункт выдачи (демо)',
      address: 'Москва, демонстрационный адрес 2',
      workTime: 'Пн–Пт 09:00–20:00',
    },
  ],
  'санкт-петербург': [
    {
      code: 'DEMO-SPB-01',
      name: 'Пункт выдачи (демо)',
      address: 'Санкт-Петербург, демонстрационный адрес 1',
      workTime: 'Пн–Вс 10:00–20:00',
      hasCashless: true,
    },
  ],
};

const DEFAULT_POINTS: PickupPoint[] = [
  {
    code: 'DEMO-PVZ-01',
    name: 'Пункт выдачи (демо)',
    address: 'Демонстрационный адрес пункта выдачи',
    workTime: 'Пн–Вс 10:00–20:00',
  },
];

function normalizeCity(city: string): string {
  return city.trim().toLowerCase().replace(/ё/g, 'е');
}

export class DemoDeliveryProvider implements DeliveryProvider {
  readonly id = 'demo';
  readonly name = 'Демонстрационный расчёт';
  readonly isLive = false;

  async calculate(address: DeliveryAddressInput, parcel: DeliveryPackage): Promise<DeliveryOption[]> {
    if (!address.city.trim()) return [];

    // условная формула: база + надбавка за вес; нужна только чтобы UI умел
    // показывать разные тарифы и сроки
    const weightSurcharge = Math.ceil(Math.max(parcel.weight, 100) / 500) * 60;
    const pickupPrice = 290 + weightSurcharge;
    const courierPrice = pickupPrice + 260;

    return [
      {
        id: 'demo-pickup',
        name: 'До пункта выдачи',
        kind: 'pickup_point',
        price: pickupPrice,
        minDays: 3,
        maxDays: 6,
        requiresPickupPoint: true,
      },
      {
        id: 'demo-courier',
        name: 'Курьером до двери',
        kind: 'courier',
        price: courierPrice,
        minDays: 3,
        maxDays: 7,
        requiresPickupPoint: false,
      },
    ];
  }

  async getPickupPoints(city: string): Promise<PickupPoint[]> {
    return CITY_PICKUP_POINTS[normalizeCity(city)] ?? DEFAULT_POINTS;
  }

  async createShipment(request: ShipmentRequest): Promise<ShipmentResult> {
    // накладная не создаётся: номер условный и не существует в системе перевозчика
    return { trackingNumber: `DEMO-${request.orderNumber}` };
  }
}
