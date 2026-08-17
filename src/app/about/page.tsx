import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { Icon } from '@/components/common/Icon';
import { brandAssets } from '@/config/brand';
import { storeConfig } from '@/config/store';

export const metadata: Metadata = {
  title: 'О магазине',
  description:
    'Магазин «Новый Минерал»: коллекционные минералы, изделия из натурального камня, украшения и книги.',
  alternates: { canonical: '/about' },
};

interface Attribution {
  file: string;
  title: string;
  page: string;
  license: string;
  licenseUrl?: string;
  author: string;
}

/** Список изображений-заглушек с лицензиями — обязательство перед авторами (п.49 ТЗ) */
async function readAttribution(): Promise<Attribution[]> {
  try {
    const raw = await readFile(
      path.join(process.cwd(), 'public', 'demo', 'attribution.json'),
      'utf8',
    );
    return JSON.parse(raw) as Attribution[];
  } catch {
    return [];
  }
}

export default async function AboutPage() {
  const attribution = await readAttribution();

  return (
    <div className="container-page pb-16 pt-6">
      <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'О магазине' }]} />

      <div className="mt-4 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
        <div>
          <h1 className="text-[30px] font-semibold tracking-[-0.015em] sm:text-[36px]">
            О магазине
          </h1>

          <p className="mt-5 max-w-[62ch] text-[18px] leading-relaxed">
            {storeConfig.tagline}. {storeConfig.descriptor}.
          </p>

          <p className="mt-4 max-w-[68ch] text-[16px] leading-relaxed text-muted-foreground">
            Мы помогаем любителям камня подбирать и оформлять коллекции. В каталоге — коллекционные
            образцы, изделия из натурального камня, украшения, книги и сопутствующие товары.
          </p>

          <section aria-labelledby="unique-title" className="mt-10">
            <h2 id="unique-title" className="mb-3 text-[22px] font-semibold">
              Как устроен каталог
            </h2>
            <p className="max-w-[68ch] text-[16px] leading-relaxed text-muted-foreground">
              Коллекционный образец — это конкретный физический экземпляр со своим артикулом,
              размерами и весом. На фотографиях представлен именно он, и второго такого же нет.
              Поэтому у экземпляра есть три состояния: в наличии, зарезервирован и продан.
            </p>
          </section>

          {storeConfig.social.vk && (
            <section aria-labelledby="vk-title" className="mt-10">
              <h2 id="vk-title" className="mb-3 text-[22px] font-semibold">
                Сообщество
              </h2>
              <a
                href={storeConfig.social.vk}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[16px] font-medium text-brand hover:underline"
              >
                Новый Минерал во ВКонтакте
                <Icon name="external" size={16} />
              </a>
            </section>
          )}

          <section
            aria-labelledby="prototype-title"
            className="mt-12 rounded-[var(--radius-md)] border border-border bg-surface p-6"
          >
            <h2 id="prototype-title" className="flex items-center gap-2 text-[18px] font-semibold">
              <Icon name="info" size={20} className="text-brand" />
              Это прототип — что нужно заменить
            </h2>
            <ul className="mt-3 max-w-[70ch] list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-muted-foreground">
              <li>Товары, цены, артикулы, месторождения и остатки — демонстрационные.</li>
              <li>Фотографии товаров — свободно лицензированные изображения, а не фото магазина.</li>
              <li>Контакты, юридические данные и правила доставки заказчиком не переданы.</li>
              <li>Промокоды демонстрационные; платёжный шлюз и СДЭК подключаются по credentials.</li>
            </ul>
            <p className="mt-3 text-[15px] text-muted-foreground">
              Логотип и фирменные цвета — настоящие, взяты со страницы магазина во ВКонтакте.
            </p>
          </section>

          {attribution.length > 0 && (
            <section aria-labelledby="attribution-title" className="mt-10">
              <h2 id="attribution-title" className="mb-3 text-[20px] font-semibold">
                Авторы демонстрационных фотографий
              </h2>
              <p className="mb-4 max-w-[68ch] text-[15px] text-muted-foreground">
                Изображения взяты из Wikimedia Commons и используются на условиях их лицензий.
              </p>
              <ul className="max-w-[70ch] space-y-1.5 text-[14px] text-muted-foreground">
                {attribution.map((item) => (
                  <li key={item.file}>
                    <a
                      href={item.page}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-brand hover:underline"
                    >
                      {item.title.replace(/^File:/, '')}
                    </a>
                    {' — '}
                    {item.author}
                    {', '}
                    {item.licenseUrl ? (
                      <a
                        href={item.licenseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-brand hover:underline"
                      >
                        {item.license}
                      </a>
                    ) : (
                      item.license
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside>
          <Image
            src={brandAssets.avatarLarge}
            alt="Логотип «Новый Минерал»"
            width={640}
            height={640}
            className="rounded-[var(--radius-md)]"
          />
          <div className="mt-6 rounded-[var(--radius-md)] bg-surface p-5">
            <h2 className="text-[17px] font-semibold">Каталог</h2>
            <ul className="mt-3 space-y-2 text-[15px]">
              <li>
                <Link href="/catalog/minerals" className="text-brand hover:underline">
                  Коллекционные минералы
                </Link>
              </li>
              <li>
                <Link href="/catalog/crafts" className="text-brand hover:underline">
                  Изделия из камня
                </Link>
              </li>
              <li>
                <Link href="/catalog/jewelry" className="text-brand hover:underline">
                  Украшения
                </Link>
              </li>
              <li>
                <Link href="/catalog/books" className="text-brand hover:underline">
                  Книги
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
