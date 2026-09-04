import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { Icon } from '@/components/common/Icon';
import { hasAnyContact, storeConfig } from '@/config/store';

export const metadata: Metadata = {
  title: 'Обработка персональных данных',
  description: 'Как магазин «Новый Минерал» обрабатывает данные, оставленные в форме заявки.',
  alternates: { canonical: '/privacy' },
  robots: { index: false, follow: true },
};

/**
 * Юридический текст политики заказчиком не передан.
 *
 * Придумывать его нельзя (п.61 ТЗ): это документ, который несёт правовые
 * последствия. Поэтому страница честно описывает фактическое положение дел
 * и перечисляет, что должно здесь появиться до запуска.
 */
export default function PrivacyPage() {
  return (
    <div className="container-page pb-16 pt-6">
      <Breadcrumbs
        items={[{ label: 'Главная', href: '/' }, { label: 'Обработка персональных данных' }]}
      />

      <h1 className="mb-6 mt-4 text-[30px] font-semibold tracking-[-0.015em] sm:text-[36px]">
        Обработка персональных данных
      </h1>

      <div className="max-w-[70ch] space-y-5 text-[16px] leading-relaxed text-muted-foreground">
        <p>
          Форма вопроса на сайте запрашивает имя, адрес электронной почты и сам вопрос.
          Телефон не запрашивается. Эти данные нужны только чтобы ответить вам.
        </p>

        <div className="rounded-[var(--radius-md)] border border-border bg-surface p-6">
          <h2 className="flex items-center gap-2 text-[18px] font-semibold text-foreground">
            <Icon name="alert" size={20} className="text-warning" />
            Документ ещё не утверждён
          </h2>
          <p className="mt-2">
            Сайт работает в режиме прототипа. Официальная политика обработки персональных данных
            магазином пока не передана, а придумывать юридический текст за него мы не стали.
          </p>
          <p className="mt-3">До запуска здесь должны появиться:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>наименование оператора данных, ИНН и адрес;</li>
            <li>перечень собираемых данных и цели обработки;</li>
            <li>сроки хранения и порядок отзыва согласия;</li>
            <li>контакт для обращений по вопросам обработки данных.</li>
          </ul>
        </div>

        <p>
          Отправленный вопрос попадает в панель управления магазина, где его видит владелец.
          Если связь с панелью прервётся, вопрос не сохранится — интерфейс сообщает об этом
          сразу после отправки и предлагает написать в сообщество.
        </p>

        {hasAnyContact() ? (
          <p>
            По вопросам обработки данных можно обратиться по контактам, указанным на странице{' '}
            <Link href="/contacts" className="text-brand hover:underline">
              «Контакты»
            </Link>
            .
          </p>
        ) : (
          <p>
            Контакты для обращений магазин пока не публиковал. Связаться можно через{' '}
            {storeConfig.social.vk ? (
              <a
                href={storeConfig.social.vk}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline"
              >
                сообщество ВКонтакте
              </a>
            ) : (
              'магазин'
            )}
            .
          </p>
        )}
      </div>
    </div>
  );
}
