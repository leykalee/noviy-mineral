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
 * Интеграционный слой СДЭК (п.37 ТЗ).
 *
 * Здесь описан контракт и точки вызова реального API v2. Тела запросов
 * намеренно не «додуманы»: подключение выполняется после получения боевых
 * credentials и согласования тарифного договора с заказчиком.
 *
 * Credentials читаются только на сервере — в клиентский бандл этот файл не попадает.
 */

const API_BASE = process.env.CDEK_API_BASE ?? 'https://api.cdek.ru/v2';

interface CdekToken {
  access_token: string;
  expires_at: number;
}

export class CdekDeliveryProvider implements DeliveryProvider {
  readonly id = 'cdek';
  readonly name = 'СДЭК';
  readonly isLive = true;

  private token: CdekToken | null = null;

  constructor(
    private readonly account: string,
    private readonly securePassword: string,
  ) {}

  /** OAuth client_credentials; токен переиспользуется до истечения срока */
  private async getToken(): Promise<string> {
    if (this.token && this.token.expires_at > Date.now() + 30_000) {
      return this.token.access_token;
    }

    const response = await fetch(`${API_BASE}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.account,
        client_secret: this.securePassword,
      }),
    });

    if (!response.ok) {
      throw new Error(`СДЭК: не удалось получить токен (${response.status})`);
    }

    const json = (await response.json()) as { access_token: string; expires_in: number };
    this.token = {
      access_token: json.access_token,
      expires_at: Date.now() + json.expires_in * 1000,
    };
    return this.token.access_token;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await this.getToken();
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
    if (!response.ok) {
      throw new Error(`СДЭК ${path}: ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  async calculate(
    _address: DeliveryAddressInput,
    _parcel: DeliveryPackage,
  ): Promise<DeliveryOption[]> {
    // POST /calculator/tarifflist — требует согласованного списка тарифных кодов
    throw new Error(
      'Расчёт СДЭК не подключён: нужны боевые credentials и согласованные тарифы.',
    );
  }

  async getPickupPoints(_city: string): Promise<PickupPoint[]> {
    // GET /deliverypoints?city_code=... — требует справочника кодов городов
    throw new Error('Список ПВЗ СДЭК не подключён: нужны боевые credentials.');
  }

  async createShipment(_request: ShipmentRequest): Promise<ShipmentResult> {
    // POST /orders — создание заказа и накладной
    throw new Error('Создание накладной СДЭК не подключено: нужны боевые credentials.');
  }
}
