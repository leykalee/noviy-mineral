'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { Product } from '@/types';
import { Icon } from '@/components/common/Icon';
import { storeConfig } from '@/config/store';
import { leadSchema } from '@/lib/lead-schema';
import { fieldErrors } from '@/lib/order-schema';
import { cx } from '@/lib/cx';

/**
 * Вопрос магазину.
 *
 * Каталог большой, а коллекционный образец покупают глазами — магазину важно
 * уметь ответить вручную. Телефон не спрашиваем: человеку проще написать
 * вопрос и оставить почту для ответа.
 *
 * Ничего не обещаем сверх реального: пока почта магазина не подключена,
 * подтверждение честно говорит, что обращение сохранено только в журнале
 * сервера, и предлагает написать в сообщество.
 */
export function LeadForm({ product }: { product?: Product }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [consent, setConsent] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ delivered: boolean } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFailed(null);

    const parsed = leadSchema.safeParse({ name, email, question, consent });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setSending(true);
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const json = await response.json();
      if (!response.ok) {
        if (json.errors) setErrors(json.errors);
        else setFailed(json.error ?? 'Не удалось отправить вопрос. Попробуйте ещё раз.');
        return;
      }
      setSent({ delivered: Boolean(json.delivered) });
    } catch {
      setFailed('Сеть недоступна. Проверьте соединение и повторите.');
    } finally {
      setSending(false);
    }
  };

  const inputClass = (invalid: boolean) =>
    cx(
      'h-13 w-full rounded-[var(--radius-sm)] border bg-white px-4 text-[16px] outline-none transition-colors duration-[var(--dur-fast)]',
      invalid ? 'border-danger' : 'border-border-strong focus:border-brand',
    );

  return (
    <section aria-labelledby="lead-title" className="bg-surface">
      <div className="container-page py-14 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-16">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-[var(--radius-xs)] bg-accent-soft px-3 py-1.5 text-[13px] font-medium text-accent">
              <Icon name="sparkle" size={15} />
              Подбор вручную
            </p>

            <h2
              id="lead-title"
              className="text-[28px] font-semibold leading-[1.12] tracking-[-0.015em] sm:text-[36px]"
            >
              Поможем выбрать экземпляр
            </h2>

            <p className="mt-4 max-w-[46ch] text-[17px] leading-relaxed text-muted-foreground">
              Ищете конкретный минерал, размер или образец в подарок? Напишите, что нужно, —
              ответим и подберём из наличия.
            </p>

            {sent ? (
              <div className="mt-8 rounded-[var(--radius-md)] border border-border bg-white p-6">
                <p className="flex items-center gap-2.5 text-[17px] font-semibold text-success">
                  <Icon name="check" size={22} />
                  Вопрос отправлен
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                  {sent.delivered
                    ? 'Ответим на указанную почту.'
                    : 'Форма работает в тестовом режиме: почта магазина ещё не подключена, поэтому обращение сохранено только в журнале сервера. Чтобы вопрос дошёл наверняка, напишите в сообщество.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSent(null);
                    setQuestion('');
                    setConsent(false);
                  }}
                  className="mt-4 text-[15px] font-medium text-brand hover:underline"
                >
                  Задать ещё один вопрос
                </button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="mt-8 max-w-[520px]">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="lead-name" className="mb-1.5 block text-[14px] font-medium">
                      Имя
                      <span className="text-danger" aria-hidden="true">
                        {' '}
                        *
                      </span>
                    </label>
                    <input
                      id="lead-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      aria-invalid={Boolean(errors.name)}
                      className={inputClass(Boolean(errors.name))}
                    />
                    {errors.name && (
                      <p role="alert" className="mt-1.5 text-[13px] text-danger">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lead-email" className="mb-1.5 block text-[14px] font-medium">
                      Почта для ответа
                      <span className="text-danger" aria-hidden="true">
                        {' '}
                        *
                      </span>
                    </label>
                    <input
                      id="lead-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      aria-invalid={Boolean(errors.email)}
                      className={inputClass(Boolean(errors.email))}
                    />
                    {errors.email && (
                      <p role="alert" className="mt-1.5 text-[13px] text-danger">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                <label htmlFor="lead-question" className="mb-1.5 mt-4 block text-[14px] font-medium">
                  Вопрос
                  <span className="text-danger" aria-hidden="true">
                    {' '}
                    *
                  </span>
                </label>
                <textarea
                  id="lead-question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={4}
                  placeholder="Например: ищу флюорит с Дальнегорска до 5 000 ₽, размер от 60 мм"
                  aria-invalid={Boolean(errors.question)}
                  className={cx(
                    'w-full rounded-[var(--radius-sm)] border bg-white px-4 py-3 text-[16px] leading-relaxed outline-none transition-colors duration-[var(--dur-fast)]',
                    errors.question ? 'border-danger' : 'border-border-strong focus:border-brand',
                  )}
                />
                {errors.question && (
                  <p role="alert" className="mt-1.5 text-[13px] text-danger">
                    {errors.question}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="mt-5 h-13 w-full rounded-[var(--radius-sm)] bg-accent px-7 text-[16px] font-medium text-white transition-colors duration-[var(--dur-fast)] hover:bg-accent-hover disabled:opacity-45 sm:w-auto"
                >
                  {sending ? 'Отправляем…' : 'Отправить вопрос'}
                </button>

                <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    aria-invalid={Boolean(errors.consent)}
                    className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]"
                  />
                  <span>
                    Согласен на обработку{' '}
                    <Link href="/privacy" className="underline underline-offset-2 hover:text-brand">
                      персональных данных
                    </Link>
                  </span>
                </label>
                {errors.consent && (
                  <p role="alert" className="mt-1.5 text-[13px] text-danger">
                    {errors.consent}
                  </p>
                )}

                {failed && (
                  <p role="alert" className="mt-4 flex gap-2 rounded-[var(--radius-sm)] bg-danger-soft px-3 py-2.5 text-[14px] text-danger">
                    <Icon name="alert" size={17} className="mt-0.5 shrink-0" />
                    {failed}
                  </p>
                )}
              </form>
            )}

            {/* второй канал связи: не всем удобно писать почтой */}
            {storeConfig.social.vk && (
              <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-muted-foreground">
                Удобнее в мессенджере?
                <a
                  href={storeConfig.social.vk}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-brand hover:underline"
                >
                  Написать в сообщество ВКонтакте
                  <Icon name="external" size={16} />
                </a>
              </p>
            )}
          </div>

          {/* справа — настоящий экземпляр из каталога, а не абстрактная картинка */}
          {product?.images[0] && (
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-3 -z-10 rounded-[var(--radius-lg)] bg-gradient-to-br from-brand-soft via-accent-soft to-brand-soft"
              />
              <Link
                href={`/product/${product.slug}`}
                className="group relative block aspect-4/3 overflow-hidden rounded-[var(--radius-lg)] bg-surface-strong"
              >
                <Image
                  src={product.images[0].url}
                  alt={product.images[0].alt || product.name}
                  fill
                  sizes="(min-width: 1024px) 44vw, 100vw"
                  className="object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease)] group-hover:scale-[1.03]"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/75 to-transparent p-4 pt-12">
                  <span className="block text-[15px] font-medium text-white">{product.name}</span>
                  <span className="tnum block text-[13px] text-white/75">{product.sku}</span>
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
