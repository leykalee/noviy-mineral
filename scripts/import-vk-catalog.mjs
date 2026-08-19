/**
 * Импорт каталога из витрины сообщества ВКонтакте.
 *
 * Запуск:
 *   VK_TOKEN=<пользовательский токен> node scripts/import-vk-catalog.mjs
 *
 * Токен нужен ПОЛЬЗОВАТЕЛЬСКИЙ, с правом market: методы market.* недоступны
 * токену сообщества (VK отвечает ошибкой 27).
 *
 * Что делает:
 *   1. забирает подборки (market.getAlbums) — это разделы витрины;
 *   2. забирает товары (market.get) со всеми фотографиями;
 *   3. скачивает фотографии в public/catalog/;
 *   4. пишет src/data/catalog/products.generated.ts в формате модели проекта.
 *
 * Токен нигде не сохраняется и в репозиторий не попадает.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const OWNER_ID = -215855991; // сообщество «Новый минерал»
const API = 'https://api.vk.com/method';
const VERSION = '5.199';
const TOKEN = process.env.VK_TOKEN;

const IMAGES_DIR = path.join(process.cwd(), 'public', 'catalog');
const DATA_DIR = path.join(process.cwd(), 'src', 'data', 'catalog');

if (!TOKEN) {
  console.error('Не задан VK_TOKEN. Запуск: VK_TOKEN=<токен> node scripts/import-vk-catalog.mjs');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function vk(method, params = {}) {
  const query = new URLSearchParams({ ...params, v: VERSION, access_token: TOKEN });
  const response = await fetch(`${API}/${method}?${query}`);
  const json = await response.json();
  if (json.error) {
    throw new Error(`${method}: ${json.error.error_msg} (код ${json.error.error_code})`);
  }
  // VK ограничивает частоту запросов
  await sleep(350);
  return json.response;
}

/** Транслитерация для человекочитаемых адресов страниц */
function slugify(value) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
    й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
    у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
    э: 'e', ю: 'yu', я: 'ya',
  };
  return value
    .toLowerCase()
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Самая крупная версия фотографии из тех, что отдал VK */
function largestPhoto(photo) {
  const sizes = photo.sizes ?? [];
  if (!sizes.length) return null;
  return sizes.reduce((best, s) => (s.width > (best?.width ?? 0) ? s : best), null);
}

async function downloadImage(url, file) {
  const target = path.join(IMAGES_DIR, file);
  if (existsSync(target)) return true;
  const response = await fetch(url);
  if (!response.ok) return false;
  const buffer = Buffer.from(await response.arrayBuffer());
  await sharp(buffer)
    .rotate()
    .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(target);
  return true;
}

/** Из названия товара вытаскиваем минерал и месторождение, если они там есть */
function guessMineral(name) {
  const known = [
    'Аметист', 'Флюорит', 'Пирит', 'Малахит', 'Кварц', 'Агат', 'Кальцит', 'Турмалин',
    'Азурит', 'Родонит', 'Лабрадор', 'Обсидиан', 'Селенит', 'Целестин', 'Яшма',
    'Авантюрин', 'Халцедон', 'Топаз', 'Гранат', 'Аквамарин', 'Берилл', 'Апатит',
    'Барит', 'Опал', 'Хризопраз', 'Родохрозит', 'Ставролит', 'Данбурит', 'Аметрин',
  ];
  const lower = name.toLowerCase();
  return known.find((m) => lower.includes(m.toLowerCase())) ?? null;
}

async function main() {
  await mkdir(IMAGES_DIR, { recursive: true });
  await mkdir(DATA_DIR, { recursive: true });

  console.log('Загружаю подборки витрины…');
  const albumsResponse = await vk('market.getAlbums', { owner_id: OWNER_ID, count: 100 });
  const albums = albumsResponse.items ?? [];
  console.log(`  подборок: ${albums.length}`);

  console.log('Загружаю товары…');
  const products = [];
  let offset = 0;
  for (;;) {
    const page = await vk('market.get', {
      owner_id: OWNER_ID,
      count: 200,
      offset,
      extended: 1,
      with_disabled: 0,
    });
    products.push(...(page.items ?? []));
    console.log(`  получено ${products.length} из ${page.count}`);
    offset += 200;
    if (products.length >= page.count || !page.items?.length) break;
  }

  // к какой подборке относится товар
  const albumOf = new Map();
  for (const album of albums) {
    const items = await vk('market.get', {
      owner_id: OWNER_ID,
      album_id: album.id,
      count: 200,
      extended: 0,
    });
    for (const item of items.items ?? []) albumOf.set(item.id, album.title);
    console.log(`  подборка «${album.title}»: ${items.count} товаров`);
  }

  console.log('Скачиваю фотографии…');
  const result = [];
  for (const [index, item] of products.entries()) {
    const slug = `${slugify(item.title)}-${item.id}`;
    const images = [];
    const photos = item.photos?.length ? item.photos : item.thumb_photo ? [{ sizes: [{ url: item.thumb_photo, width: 400, height: 400 }] }] : [];

    for (const [photoIndex, photo] of photos.entries()) {
      const best = largestPhoto(photo);
      if (!best) continue;
      const file = `${slug}-${photoIndex + 1}.webp`;
      const ok = await downloadImage(best.url, file);
      if (ok) images.push({ url: `/catalog/${file}`, alt: item.title, width: 1400, height: 1050 });
    }

    result.push({
      vkId: item.id,
      slug,
      sku: item.sku || `VK-${item.id}`,
      name: item.title,
      description: item.description ?? '',
      price: Math.round(Number(item.price?.amount ?? 0) / 100),
      oldPrice: item.price?.old_amount ? Math.round(Number(item.price.old_amount) / 100) : null,
      available: item.availability === 0,
      album: albumOf.get(item.id) ?? null,
      mineral: guessMineral(item.title),
      images,
      url: `https://vk.com/market-${Math.abs(OWNER_ID)}?w=product-${Math.abs(OWNER_ID)}_${item.id}`,
    });

    if ((index + 1) % 10 === 0) console.log(`  обработано ${index + 1} из ${products.length}`);
  }

  await writeFile(
    path.join(DATA_DIR, 'vk-raw.json'),
    JSON.stringify({ albums: albums.map((a) => a.title), products: result }, null, 2),
  );

  console.log(`\nГотово: ${result.length} товаров, фотографий скачано в public/catalog/`);
  console.log('Сырые данные: src/data/catalog/vk-raw.json');
  console.log('Дальше запустите преобразование в модель проекта.');
}

main().catch((error) => {
  console.error('Ошибка импорта:', error.message);
  process.exit(1);
});
