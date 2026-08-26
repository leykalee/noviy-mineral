import Image from 'next/image';
import Link from 'next/link';
import type { NewsPost } from '@/lib/news';
import { ButtonLink } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { storeConfig } from '@/config/store';
import { formatDate } from '@/lib/format';

/**
 * Анонс новостей на главной.
 *
 * Пока лента из сообщества не подключена, показываем приглашение в раздел
 * и в сообщество, а не выдуманные заголовки.
 */
export function NewsTeaser({ posts, connected }: { posts: NewsPost[]; connected: boolean }) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-start gap-5 rounded-[var(--radius-md)] bg-brand px-6 py-10 text-white sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <div className="max-w-[62ch]">
          <h3 className="text-[20px] font-semibold sm:text-[24px]">
            Ездим на выставки и привозим новые образцы
          </h3>
          <p className="mt-2 text-[16px] leading-relaxed text-white/85">
            {connected
              ? 'Отчёты с выставок и рассказы о поступлениях — в разделе новостей.'
              : 'Отчёты с выставок и рассказы о поступлениях публикуются в сообществе ВКонтакте.'}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <ButtonLink href="/news" variant="inverse" size="lg">
            Читать новости
          </ButtonLink>
          {storeConfig.social.vk && (
            <a
              href={storeConfig.social.vk}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-13 items-center gap-2 rounded-[var(--radius-sm)] border border-white/35 px-5 text-[16px] font-medium text-white transition-colors duration-[var(--dur-fast)] hover:bg-white/10"
            >
              Сообщество
              <Icon name="external" size={17} />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <li key={post.id}>
          <article className="flex h-full flex-col">
            {post.image && (
              <Link
                href="/news"
                className="group relative mb-4 block aspect-4/3 overflow-hidden rounded-[var(--radius-md)] bg-surface-strong"
              >
                <Image
                  src={post.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease)] group-hover:scale-[1.03]"
                />
              </Link>
            )}
            <time dateTime={post.date} className="text-[13px] text-muted-foreground">
              {formatDate(post.date)}
            </time>
            <h3 className="mt-1 text-[18px] font-semibold leading-snug">
              <Link href="/news" className="hover:text-brand">
                {post.title}
              </Link>
            </h3>
            <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-muted-foreground">
              {post.text}
            </p>
          </article>
        </li>
      ))}
    </ul>
  );
}
