import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { Icon } from '@/components/common/Icon';
import { hasAnyContact, storeConfig } from '@/config/store';

export const metadata: Metadata = {
  title: 'Контакты',
  description: 'Как связаться с магазином «Новый Минерал».',
  alternates: { canonical: '/contacts' },
};

/**
 * Контакты (п.61 ТЗ): показываем только то, что реально передано.
 * Ни телефона, ни адреса, ни юрлица не выдумываем.
 */
export default function ContactsPage() {
  const { contacts, social } = storeConfig;

  return (
    <div className="container-page pb-16 pt-6">
      <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Контакты' }]} />

      <h1 className="mb-8 mt-4 text-[30px] font-semibold tracking-[-0.015em] sm:text-[36px]">
        Контакты
      </h1>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <section aria-labelledby="channels-title">
          <h2 id="channels-title" className="mb-4 text-[20px] font-semibold">
            Связаться с нами
          </h2>

          {hasAnyContact() ? (
            <ul className="space-y-3 text-[16px]">
              {contacts.phone && (
                <li className="flex items-center gap-3">
                  <Icon name="info" size={20} className="shrink-0 text-brand" />
                  <a href={`tel:${contacts.phone.replace(/[^+\d]/g, '')}`} className="hover:text-brand">
                    {contacts.phone}
                  </a>
                </li>
              )}
              {contacts.email && (
                <li className="flex items-center gap-3">
                  <Icon name="info" size={20} className="shrink-0 text-brand" />
                  <a href={`mailto:${contacts.email}`} className="hover:text-brand">
                    {contacts.email}
                  </a>
                </li>
              )}
              {contacts.address && (
                <li className="flex items-start gap-3">
                  <Icon name="pin" size={20} className="mt-0.5 shrink-0 text-brand" />
                  <span>{contacts.address}</span>
                </li>
              )}
              {contacts.schedule && (
                <li className="flex items-start gap-3">
                  <Icon name="info" size={20} className="mt-0.5 shrink-0 text-brand" />
                  <span>{contacts.schedule}</span>
                </li>
              )}
            </ul>
          ) : (
            <div className="rounded-[var(--radius-md)] border border-border bg-surface p-5">
              <p className="text-[16px] leading-relaxed text-muted-foreground">
                Телефон, почта и адрес магазина пока не переданы для публикации. Самый надёжный
                способ связи — сообщество во ВКонтакте.
              </p>
            </div>
          )}

          {social.vk && (
            <a
              href={social.vk}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-[var(--radius-sm)] bg-brand px-5 text-[16px] font-medium text-white transition-colors duration-[var(--dur-fast)] hover:bg-brand-hover"
            >
              Написать во ВКонтакте
              <Icon name="external" size={18} />
            </a>
          )}
        </section>

        <section aria-labelledby="legal-title">
          <h2 id="legal-title" className="mb-4 text-[20px] font-semibold">
            Реквизиты
          </h2>
          {contacts.legalName || contacts.inn || contacts.ogrn ? (
            <dl className="space-y-2 text-[16px]">
              {contacts.legalName && (
                <div>
                  <dt className="text-[14px] text-muted-foreground">Юридическое лицо</dt>
                  <dd>{contacts.legalName}</dd>
                </div>
              )}
              {contacts.inn && (
                <div>
                  <dt className="text-[14px] text-muted-foreground">ИНН</dt>
                  <dd className="tnum">{contacts.inn}</dd>
                </div>
              )}
              {contacts.ogrn && (
                <div>
                  <dt className="text-[14px] text-muted-foreground">ОГРН</dt>
                  <dd className="tnum">{contacts.ogrn}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-[16px] leading-relaxed text-muted-foreground">
              Юридические данные для публикации не переданы. Их нужно указать до запуска магазина —
              это требование к интернет-торговле.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
