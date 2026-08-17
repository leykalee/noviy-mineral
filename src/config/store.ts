/**
 * Единственный источник правды по данным магазина.
 *
 * Правило (п.61 ТЗ): ничего не выдумываем. Всё, что не подтверждено заказчиком, — `null`,
 * и UI обязан такой пункт просто не показывать. Не подставляем «примерные» телефоны,
 * адреса, сроки и условия доставки.
 */

export interface StoreContact {
  /** null → блок не рендерится */
  phone: string | null;
  email: string | null;
  address: string | null;
  /** Часы работы */
  schedule: string | null;
  /** Юридическое лицо, ИНН, ОГРН */
  legalName: string | null;
  inn: string | null;
  ogrn: string | null;
}

interface StoreConfig {
  name: string;
  tagline: string;
  descriptor: string;
  contacts: StoreContact;
  social: { vk: string | null; telegram: string | null; whatsapp: string | null };
  claims: {
    freeDeliveryFrom: { enabled: boolean; amount: number };
    giftWithEveryOrder: { enabled: boolean };
  };
  deliveryRulesConfirmed: boolean;
  promoCodesAreDemo: boolean;
}

export const storeConfig: StoreConfig = {
  name: 'Новый Минерал',
  /** Статус сообщества VK — реальный текст заказчика */
  tagline: 'Новые минералы для души и коллекции',
  /** Дескриптор с обложки VK — реальный текст заказчика */
  descriptor: 'Коллекционные минералы и изделия из натурального камня',

  contacts: {
    phone: null,
    email: null,
    address: null,
    schedule: null,
    legalName: null,
    inn: null,
    ogrn: null,
  },

  social: {
    /** Подтверждённая ссылка */
    vk: 'https://vk.ru/noviy_mineral',
    telegram: null,
    whatsapp: null,
  },

  /**
   * Обещания с обложки VK. Показываем только после подтверждения заказчиком —
   * пока это односторонняя маркетинговая надпись, а не согласованные условия.
   */
  claims: {
    freeDeliveryFrom: {
      enabled: false,
      /** Значение с обложки VK, требует подтверждения */
      amount: 5000,
    },
    giftWithEveryOrder: {
      enabled: false,
    },
  },

  /** Реальные правила доставки не переданы — страница /delivery это честно сообщает */
  deliveryRulesConfirmed: false,
  /** Реальных промокодов заказчик не передавал: коды ниже — демонстрационные */
  promoCodesAreDemo: true,
};

/** Есть ли хоть один контакт — от этого зависит, рендерить ли блок контактов */
export function hasAnyContact(c: StoreContact = storeConfig.contacts): boolean {
  return Boolean(c.phone || c.email || c.address);
}
