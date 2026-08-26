import 'server-only';

/**
 * Новости магазина — записи со стены сообщества ВКонтакте.
 *
 * Токен нужен ПОЛЬЗОВАТЕЛЬСКИЙ либо сервисный ключ приложения: методу wall.get
 * недоступна авторизация от имени сообщества (VK отвечает ошибкой 27).
 * Пока токена нет, раздел показывает пустое состояние со ссылкой на сообщество,
 * а не выдуманные записи.
 */

const OWNER_ID = -215855991;
const API = 'https://api.vk.com/method';
const VERSION = '5.199';

export interface NewsPost {
  id: number;
  date: string;
  /** Заголовок — первая строка записи */
  title: string;
  text: string;
  image: string | null;
  url: string;
}

export interface NewsResult {
  posts: NewsPost[];
  /** false — источник не подключён, интерфейс обязан сказать об этом честно */
  connected: boolean;
  error?: string;
}

/** Первая строка записи работает заголовком, остальное — телом */
function splitPost(text: string): { title: string; body: string } {
  const clean = text.replace(/\s*\n\s*\n\s*/g, '\n\n').trim();
  const [first, ...rest] = clean.split('\n');
  const title = first.length > 90 ? `${first.slice(0, 88).trimEnd()}…` : first;
  return { title: title || 'Запись сообщества', body: rest.join('\n').trim() || clean };
}

function largestPhoto(attachments: unknown[]): string | null {
  for (const attachment of attachments as { type: string; photo?: { sizes?: { url: string; width: number }[] } }[]) {
    if (attachment.type !== 'photo' || !attachment.photo?.sizes?.length) continue;
    const best = attachment.photo.sizes.reduce((a, b) => (b.width > a.width ? b : a));
    return best.url;
  }
  return null;
}

export async function fetchNews(limit = 12): Promise<NewsResult> {
  const token = process.env.VK_TOKEN;
  if (!token) return { posts: [], connected: false };

  try {
    const query = new URLSearchParams({
      owner_id: String(OWNER_ID),
      count: String(limit),
      filter: 'owner',
      v: VERSION,
      access_token: token,
    });
    const response = await fetch(`${API}/wall.get?${query}`, {
      // новости обновляются нечасто — держим кэш час
      next: { revalidate: 3600 },
    });
    const json = await response.json();

    if (json.error) {
      return { posts: [], connected: false, error: json.error.error_msg };
    }

    const posts: NewsPost[] = (json.response?.items ?? [])
      .filter((item: { text?: string }) => (item.text ?? '').trim().length > 0)
      .map((item: { id: number; date: number; text: string; attachments?: unknown[] }) => {
        const { title, body } = splitPost(item.text);
        return {
          id: item.id,
          date: new Date(item.date * 1000).toISOString(),
          title,
          text: body,
          image: largestPhoto(item.attachments ?? []),
          url: `https://vk.com/wall${OWNER_ID}_${item.id}`,
        };
      });

    return { posts, connected: true };
  } catch (cause) {
    return { posts: [], connected: false, error: cause instanceof Error ? cause.message : 'сеть' };
  }
}
