/**
 * Базовый адрес сайта — одна точка правды для метаданных, robots, sitemap
 * и адресов возврата после оплаты.
 *
 * Пустую строку нельзя лечить через `??`: Next подставляет NEXT_PUBLIC_*
 * на этапе сборки, и незаданная переменная превращается в '', а не в
 * undefined. Поэтому проверяем именно непустое значение.
 *
 * Если адрес не задан руками, берём его у площадки: так сборка не падает
 * на свежем хостинге, где переменную ещё не успели прописать.
 */

function firstFilled(...values: (string | undefined)[]): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

function normalize(value: string): string {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, '');
}

const fromPlatform = firstFilled(
  // Vercel: стабильный домен продакшена, затем адрес конкретного деплоя
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  process.env.VERCEL_URL,
  // Netlify
  process.env.URL,
  process.env.DEPLOY_PRIME_URL,
);

export const siteUrl = normalize(
  firstFilled(process.env.NEXT_PUBLIC_SITE_URL, fromPlatform) ?? 'http://localhost:3000',
);
