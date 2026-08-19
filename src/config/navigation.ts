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
      { label: 'Кристаллы', href: '/catalog/crystals' },
      { label: 'Друзы и щётки', href: '/catalog/druzes' },
      { label: 'Полированные камни', href: '/catalog/polished' },
      { label: 'Галтовка', href: '/catalog/tumbled' },
      { label: 'Окаменелости', href: '/catalog/fossils' },
    ],
  },
  {
    title: 'Изделия',
    allLink: { label: 'Все изделия', href: '/catalog/crafts' },
    links: [
      { label: 'Шары и яйца', href: '/catalog/spheres' },
      { label: 'Декор', href: '/catalog/decor' },
    ],
  },
  {
    title: 'Украшения',
    allLink: { label: 'Все украшения', href: '/catalog/jewelry' },
    links: [
      { label: 'Браслеты', href: '/catalog/bracelets' },
      { label: 'Кулоны', href: '/catalog/pendants' },
      { label: 'Серьги', href: '/catalog/earrings' },
    ],
  },
  {
    title: 'Для коллекционеров',
    allLink: { label: 'Весь каталог', href: '/catalog' },
    links: [
      { label: 'По минералам', href: '/catalog?sort=name', hint: 'Аметист, флюорит, пирит и другие' },
      { label: 'По месторождениям', href: '/catalog?country=Россия', hint: 'Дальнегорск, Урал, Хибины' },
      { label: 'Свечение в УФ', href: '/catalog?feature=uv' },
      { label: 'Новые поступления', href: '/new' },
    ],
  },
  {
    title: 'Другое',
    allLink: { label: 'Весь каталог', href: '/catalog' },
    links: [
      { label: 'Книги', href: '/catalog/books' },
      { label: 'Сопутствующие товары', href: '/catalog/accessories' },
      { label: 'Акции', href: '/sale' },
    ],
  },
];

/** Основная навигация в шапке */
export const primaryNav: NavLink[] = [
  { label: 'Новинки', href: '/new' },
  { label: 'Акции', href: '/sale' },
  { label: 'О магазине', href: '/about' },
  { label: 'Доставка и оплата', href: '/delivery' },
  { label: 'Контакты', href: '/contacts' },
];

/** Подборки для новичка — блок «Что ищете?» на главной (п.14 ТЗ) */
export const scenarioLinks: NavLink[] = [
  { label: 'Для коллекции', href: '/catalog/minerals?inStock=1' },
  { label: 'В подарок', href: '/catalog?priceTo=5000&inStock=1' },
  { label: 'Для интерьера', href: '/catalog/crafts?inStock=1' },
  { label: 'До 1 500 ₽', href: '/catalog?priceTo=1500&inStock=1' },
  { label: 'До 3 000 ₽', href: '/catalog?priceTo=3000&inStock=1' },
  { label: 'Светятся в УФ', href: '/catalog?feature=uv' },
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
      { label: 'Коллекционные минералы', href: '/catalog/minerals' },
      { label: 'Изделия из камня', href: '/catalog/crafts' },
      { label: 'Украшения', href: '/catalog/jewelry' },
      { label: 'Книги', href: '/catalog/books' },
      { label: 'Сопутствующие товары', href: '/catalog/accessories' },
    ],
  },
  {
    title: 'Покупателю',
    links: [
      { label: 'Доставка и оплата', href: '/delivery' },
      { label: 'Новые поступления', href: '/new' },
      { label: 'Акции', href: '/sale' },
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
