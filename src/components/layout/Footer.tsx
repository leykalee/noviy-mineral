import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/common/Icon';
import { brandAssets } from '@/config/brand';
import { footerNav } from '@/config/navigation';
import { hasAnyContact, storeConfig } from '@/config/store';

/**
 * Подвал.
 *
 * Контакты рендерятся только те, что реально переданы заказчиком.
 * Пустые значения не превращаются в «уточняется» или выдуманные данные (п.61 ТЗ).
 */
export function Footer() {
  const { contacts, social } = storeConfig;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="container-page py-12 lg:py-16">
        <div className="grid gap-x-10 gap-y-12 lg:grid-cols-[minmax(240px,280px)_1fr]">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-3"
              aria-label="Новый Минерал — на главную"
            >
              <Image
                src={brandAssets.markBadge}
                alt=""
                width={48}
                height={48}
                className="rounded-[var(--radius-sm)]"
              />
              <span className="text-[17px] font-semibold">Новый Минерал</span>
            </Link>
            <p className="mt-4 max-w-[280px] text-[14px] leading-relaxed text-muted-foreground">
              {storeConfig.descriptor}.
            </p>

            {social.vk && (
              <a
                href={social.vk}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-brand hover:underline"
              >
                Сообщество ВКонтакте
                <Icon name="external" size={15} />
              </a>
            )}
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-8 gap-y-10">
            {footerNav.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h3 className="mb-4 flex h-5 items-center text-[13px] font-semibold uppercase leading-none tracking-[0.08em] text-muted-foreground">
                  {column.title}
                </h3>
                <ul className="space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="block text-[15px] leading-6 text-foreground transition-colors duration-[var(--dur-fast)] hover:text-brand"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            {hasAnyContact() && (
              <div>
                <h3 className="mb-4 flex h-5 items-center text-[13px] font-semibold uppercase leading-none tracking-[0.08em] text-muted-foreground">
                  Контакты
                </h3>
                <ul className="space-y-2.5 text-[15px]">
                  {contacts.phone && (
                    <li>
                      <a href={`tel:${contacts.phone.replace(/[^+\d]/g, '')}`} className="hover:text-brand">
                        {contacts.phone}
                      </a>
                    </li>
                  )}
                  {contacts.email && (
                    <li>
                      <a href={`mailto:${contacts.email}`} className="hover:text-brand">
                        {contacts.email}
                      </a>
                    </li>
                  )}
                  {contacts.address && <li className="text-muted-foreground">{contacts.address}</li>}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Новый Минерал</p>
          {storeConfig.contacts.legalName ? (
            <p>{storeConfig.contacts.legalName}</p>
          ) : (
            <p>
              Прототип магазина.{' '}
              <Link href="/about" className="underline hover:text-brand">
                Что заменить перед запуском
              </Link>
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
