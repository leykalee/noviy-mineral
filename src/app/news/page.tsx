import type { Metadata } from 'next';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { ButtonLink } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { storeConfig } from '@/config/store';
import { fetchNews } from '@/lib/news';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Новости',
  description: 'Отчёты с выставок, новые поступления и события магазина «Новый Минерал».',
  alternates: { canonical: '/news' },
};

export const revalidate = 3600;

/**
 * Новости — записи со стены сообщества ВКонтакте.
 * Пока источник не подключён, страница честно об этом говорит и ведёт
 * в сообщество, а не показывает выдуманные материалы.
 */
export default async function NewsPage() {
  const { posts, connected } = await fetchNews(12);

  return (
    <div className="container-page pb-16 pt-6">
      <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Новости' }]} />

      <header className="mt-4 max-w-[70ch]">
        <span aria-hidden="true" className="mb-3 block h-1 w-10 rounded-full bg-brand-bright" />
        <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.015em] sm:text-[36px]">
          Новости
        </h1>
        <p className="mt-3 text-[16px] text-muted-foreground">
          Отчёты с выставок, новые поступления и события магазина.
        </p>
      </header>

      {posts.length > 0 ? (
        <ul className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={post.id}>
              <article className="flex h-full flex-col">
                {post.image && (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative mb-4 block aspect-4/3 overflow-hidden rounded-[var(--radius-md)] bg-surface-strong"
                  >
                    <Image
                      src={post.image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease)] group-hover:scale-[1.03]"
                    />
                  </a>
                )}
                <time dateTime={post.date} className="text-[13px] text-muted-foreground">
                  {formatDate(post.date)}
                </time>
                <h2 className="mt-1 text-[18px] font-semibold leading-snug">{post.title}</h2>
                <p className="mt-2 line-clamp-4 text-[15px] leading-relaxed text-muted-foreground">
                  {post.text}
                </p>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-1.5 pt-3 text-[15px] font-medium text-brand hover:underline"
                >
                  Читать полностью
                  <Icon name="external" size={16} />
                </a>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-10 rounded-[var(--radius-md)] border border-border bg-surface px-6 py-14 text-center">
          <Icon name="info" size={32} className="mx-auto text-muted-foreground" />
          <h2 className="mt-4 text-[20px] font-semibold">
            {connected ? 'Записей пока нет' : 'Лента ещё не подключена'}
          </h2>
          <p className="mx-auto mt-2 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">
            {connected
              ? 'Как только в сообществе появятся новые записи, они окажутся здесь.'
              : 'Новости подтягиваются из сообщества ВКонтакте. Подключение требует ключа доступа с правом чтения стены — до тех пор материалы можно читать прямо в сообществе.'}
          </p>
          {storeConfig.social.vk && (
            <div className="mt-6">
              <ButtonLink href={storeConfig.social.vk} target="_blank" rel="noopener noreferrer">
                Открыть сообщество
              </ButtonLink>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
