/**
 * Структура навигации.
 *
 * Mega-menu разбит на смысловые группы (п.10 ТЗ), а не на один длинный список.
 * Классификация опирается на research: у конкурентов тип товара и минеральный вид —
 * две разные оси, поэтому «По минералам» и «По месторождениям» вынесены
 * в отдельную колонку для коллекционеров.
 */

export interface NavLink {
  label: string;
  href: string;
  /** Короткое пояснение под ссылкой в mega-menu */
  hint?: string;
}

export interface MegaMenuColumn {
  title: string;
  links: NavLink[];
  /** Ссылка «весь раздел» — первый пункт при заходе в группу на мобильных */
  allLink?: NavLink;
}

export const megaMenu: MegaMenuColumn[] = [
  {
    title: 'Минералы',
    allLink: { label: 'Все минералы', href: '/catalog/minerals' },
    links: [
      { label: 'Коллекционные образцы в боксах', href: '/catalog/boxes' },
      { label: 'До 1000 рублей', href: '/catalog/minerals?priceTo=1000' },
      { label: 'Светится в УФ', href: '/catalog/minerals?feature=uv' },
      { label: 'Редкости', href: '/catalog/rarities' },
      { label: 'Окаменелости', href: '/catalog/fossils' },
    ],
  },
  {
    title: 'Изделия',
    allLink: { label: 'Все изделия', href: '/catalog/crafts' },
    links: [
      { label: 'Декор', href: '/catalog/decor' },
      { label: 'Галтовка', href: '/catalog/tumbled' },
      { label: 'Полировка', href: '/catalog/polished' },
    ],
  },
  {
    title: 'Украшения',
    allLink: { label: 'Все украшения', href: '/catalog/jewelry' },
    links: [
      { label: 'Браслеты', href: '/catalog/bracelets' },
      { label: 'Бусы', href: '/catalog/beads' },
    ],
  },
  {
    title: 'Для коллекционеров',
    allLink: { label: 'Весь каталог', href: '/catalog' },
    links: [
      { label: 'По минералам', href: '/catalog?sort=name', hint: 'Аметист, флюорит, пирит и другие' },
      { label: 'По месторождениям', href: '/catalog?country=Россия', hint: 'Дальнегорск, Урал, Хибины' },
      { label: 'Новые поступления', href: '/new' },
    ],
  },
  {
    title: 'Другое',
    allLink: { label: 'Весь каталог', href: '/catalog' },
    links: [
      { label: 'Книги и журналы', href: '/catalog/books' },
      { label: 'Сопутствующие товары', href: '/catalog/accessories' },
      { label: 'Пластиковые модели', href: '/catalog/models' },
    ],
  },
];

/** Основная навигация в шапке */
export const primaryNav: NavLink[] = [
  { label: 'Новинки', href: '/new' },
  { label: 'Акции', href: '/sale' },
  { label: 'Новости', href: '/news' },
  { label: 'О магазине', href: '/about' },
  { label: 'Доставка и оплата', href: '/delivery' },
  { label: 'Контакты', href: '/contacts' },
];

/** Разделы личного кабинета */
export const accountNav: NavLink[] = [
  { label: 'Мои заказы', href: '/account/orders' },
  { label: 'Избранное', href: '/account/favorites' },
  { label: 'Профиль', href: '/account/profile' },
];

export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: 'Каталог',
    links: [
      { label: 'Минералы', href: '/catalog/minerals' },
      { label: 'Изделия', href: '/catalog/crafts' },
      { label: 'Украшения', href: '/catalog/jewelry' },
      { label: 'Книги и журналы', href: '/catalog/books' },
      { label: 'Сопутствующие товары', href: '/catalog/accessories' },
    ],
  },
  {
    title: 'Покупателю',
    links: [
      { label: 'Доставка и оплата', href: '/delivery' },
      { label: 'Новые поступления', href: '/new' },
      { label: 'Акции', href: '/sale' },
      { label: 'Новости', href: '/news' },
      { label: 'Избранное', href: '/favorites' },
      { label: 'Корзина', href: '/cart' },
    ],
  },
  {
    title: 'Магазин',
    links: [
      { label: 'О магазине', href: '/about' },
      { label: 'Контакты', href: '/contacts' },
      { label: 'Личный кабинет', href: '/account' },
    ],
  },
];

/**
 * Отбор пунктов меню по реально существующим разделам каталога.
 *
 * Структуру меню задаёт заказчик, а разделы заводит владелец в админке.
 * Пока раздела нет, пункт вёл бы покупателя на страницу 404 — тупик прямо
 * из шапки. Поэтому такие пункты не показываем: заведут раздел в Admik —
 * пункт появится сам.
 *
 * Пустой список разделов означает, что каталог не ответил. Тогда меню
 * оставляем как есть: показать пустую шапку хуже, чем показать всё.
 */

/** slug раздела из ссылки вида /catalog/<slug>?… ; для прочих ссылок — null */
function catalogSlug(href: string): string | null {
  if (!href.startsWith('/catalog/')) return null;
  return href.slice('/catalog/'.length).split(/[?#]/)[0] || null;
}

function keepLink(link: NavLink, available: ReadonlySet<string>): boolean {
  const slug = catalogSlug(link.href);
  return slug === null || available.has(slug);
}

export function menuForCategories(
  menu: MegaMenuColumn[],
  available: ReadonlySet<string>,
): MegaMenuColumn[] {
  if (available.size === 0) return menu;

  return menu
    .map((column) => ({
      ...column,
      allLink:
        column.allLink && !keepLink(column.allLink, available)
          ? { label: 'Весь каталог', href: '/catalog' }
          : column.allLink,
      links: column.links.filter((link) => keepLink(link, available)),
    }))
    .filter((column) => column.links.length > 0);
}

export function linksForCategories(
  groups: { title: string; links: NavLink[] }[],
  available: ReadonlySet<string>,
): { title: string; links: NavLink[] }[] {
  if (available.size === 0) return groups;
  return groups
    .map((group) => ({ ...group, links: group.links.filter((link) => keepLink(link, available)) }))
    .filter((group) => group.links.length > 0);
}
