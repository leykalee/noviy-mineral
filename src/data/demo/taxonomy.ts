import type { Category, Color, Deposit, Mineral } from '@/types';

/**
 * Товарная классификация.
 *
 * Из research (§3.3): тип товара и минеральный вид — две независимые оси,
 * их нельзя складывать в одно дерево. Здесь только типы товаров.
 * Минеральные виды — в `minerals`, месторождения — в `deposits`.
 */
export const categories: Category[] = [
  {
    id: 'c-minerals',
    slug: 'minerals',
    name: 'Коллекционные минералы',
    description:
      'Образцы для коллекции. Каждый экземпляр продаётся отдельно — на фотографиях именно он.',
    order: 1,
    menuGroup: 'minerals',
    image: {
      url: '/demo/amethyst-1.webp',
      alt: 'Кристаллы аметиста',
      width: 1400,
      height: 1050,
      isPlaceholder: true,
    },
  },
  {
    id: 'c-crystals',
    slug: 'crystals',
    name: 'Кристаллы',
    parentId: 'c-minerals',
    description: 'Одиночные кристаллы с выраженной огранкой природных граней.',
    order: 2,
    menuGroup: 'minerals',
  },
  {
    id: 'c-druses',
    slug: 'druzes',
    name: 'Друзы и щётки',
    parentId: 'c-minerals',
    description: 'Сростки кристаллов на общей основе.',
    order: 3,
    menuGroup: 'minerals',
  },
  {
    id: 'c-polished',
    slug: 'polished',
    name: 'Полированные камни',
    parentId: 'c-minerals',
    description: 'Срезы и полировки, раскрывающие рисунок камня.',
    order: 4,
    menuGroup: 'minerals',
  },
  {
    id: 'c-tumbled',
    slug: 'tumbled',
    name: 'Галтовка',
    parentId: 'c-minerals',
    description: 'Обкатанные камни — недорогой вход в коллекцию.',
    order: 5,
    menuGroup: 'minerals',
  },
  {
    id: 'c-fossils',
    slug: 'fossils',
    name: 'Окаменелости',
    parentId: 'c-minerals',
    description: 'Ископаемые остатки древних организмов.',
    order: 6,
    menuGroup: 'minerals',
  },

  {
    id: 'c-crafts',
    slug: 'crafts',
    name: 'Изделия из камня',
    description: 'Предметы из натурального камня для интерьера и рабочего стола.',
    order: 10,
    menuGroup: 'crafts',
    image: {
      url: '/demo/sphere-1.webp',
      alt: 'Шар из полированного камня',
      width: 1400,
      height: 1050,
      isPlaceholder: true,
    },
  },
  {
    id: 'c-spheres',
    slug: 'spheres',
    name: 'Шары и яйца',
    parentId: 'c-crafts',
    description: 'Точёные формы из цельного камня.',
    order: 11,
    menuGroup: 'crafts',
  },
  {
    id: 'c-decor',
    slug: 'decor',
    name: 'Декор',
    parentId: 'c-crafts',
    description: 'Предметы для интерьера из натурального камня.',
    order: 12,
    menuGroup: 'crafts',
  },

  {
    id: 'c-jewelry',
    slug: 'jewelry',
    name: 'Украшения',
    description: 'Украшения с натуральными камнями.',
    order: 20,
    menuGroup: 'jewelry',
    image: {
      url: '/demo/bracelet-1.webp',
      alt: 'Браслет из натуральных камней',
      width: 1400,
      height: 1050,
      isPlaceholder: true,
    },
  },
  {
    id: 'c-bracelets',
    slug: 'bracelets',
    name: 'Браслеты',
    parentId: 'c-jewelry',
    order: 21,
    menuGroup: 'jewelry',
  },
  {
    id: 'c-pendants',
    slug: 'pendants',
    name: 'Кулоны',
    parentId: 'c-jewelry',
    order: 22,
    menuGroup: 'jewelry',
  },
  {
    id: 'c-earrings',
    slug: 'earrings',
    name: 'Серьги',
    parentId: 'c-jewelry',
    order: 23,
    menuGroup: 'jewelry',
  },

  {
    id: 'c-books',
    slug: 'books',
    name: 'Книги',
    description: 'Определители, справочники и литература о минералах.',
    order: 30,
    menuGroup: 'other',
    image: {
      url: '/demo/book-1.webp',
      alt: 'Книга о минералах',
      width: 1400,
      height: 1050,
      isPlaceholder: true,
    },
  },
  {
    id: 'c-accessories',
    slug: 'accessories',
    name: 'Сопутствующие товары',
    description: 'Подставки, боксы и оптика для работы с коллекцией.',
    order: 31,
    menuGroup: 'other',
    image: {
      url: '/demo/stand-1.webp',
      alt: 'Подставка для минералогического образца',
      width: 1400,
      height: 1050,
      isPlaceholder: true,
    },
  },
];

/**
 * Минеральные виды.
 *
 * Поле `about` — справка о минеральном ВИДЕ (общеизвестные минералогические сведения),
 * а не о конкретном экземпляре и не о наличии его в магазине.
 */
export const minerals: Mineral[] = [
  {
    id: 'm-amethyst',
    slug: 'amethyst',
    name: 'Аметист',
    formula: 'SiO₂',
    about:
      'Фиолетовая разновидность кварца. Окраска связана с примесью железа и структурными дефектами, при нагревании может изменяться. Часто встречается в жеодах и friable-щётках.',
    isPopular: true,
    image: { url: '/demo/amethyst-2.webp', alt: 'Аметист', width: 1400, height: 1050, isPlaceholder: true },
  },
  {
    id: 'm-fluorite',
    slug: 'fluorite',
    name: 'Флюорит',
    formula: 'CaF₂',
    about:
      'Фторид кальция, кристаллизуется в кубической сингонии — характерны кубы и октаэдры. Окраска варьирует от бесцветной до зелёной, фиолетовой и синей. Многие образцы люминесцируют в ультрафиолете, и само явление флуоресценции названо по этому минералу.',
    isPopular: true,
    image: { url: '/demo/fluorite-1.webp', alt: 'Флюорит', width: 1400, height: 1050, isPlaceholder: true },
  },
  {
    id: 'm-pyrite',
    slug: 'pyrite',
    name: 'Пирит',
    formula: 'FeS₂',
    about:
      'Сульфид железа с латунно-жёлтым металлическим блеском. Образует кубические кристаллы с характерной штриховкой на гранях, а также пентагондодекаэдры.',
    isPopular: true,
    image: { url: '/demo/pyrite-1.webp', alt: 'Пирит', width: 1400, height: 1050, isPlaceholder: true },
  },
  {
    id: 'm-malachite',
    slug: 'malachite',
    name: 'Малахит',
    formula: 'Cu₂CO₃(OH)₂',
    about:
      'Водный карбонат меди зелёного цвета. Обычно встречается в виде почковидных натёчных агрегатов с концентрическим рисунком, который проявляется при полировке.',
    isPopular: true,
    image: { url: '/demo/malachite-1.webp', alt: 'Малахит', width: 1400, height: 1050, isPlaceholder: true },
  },
  {
    id: 'm-quartz',
    slug: 'quartz',
    name: 'Кварц',
    formula: 'SiO₂',
    about:
      'Один из самых распространённых минералов земной коры. Кристаллизуется в виде шестигранных призм с пирамидальным окончанием. Разновидности различаются по окраске и включениям.',
    isPopular: true,
    image: { url: '/demo/quartz-1.webp', alt: 'Горный хрусталь', width: 1400, height: 1050, isPlaceholder: true },
  },
  {
    id: 'm-agate',
    slug: 'agate',
    name: 'Агат',
    formula: 'SiO₂',
    about:
      'Полосчатая разновидность халцедона. Слоистый рисунок формируется при последовательном отложении кремнезёма в пустотах вулканических пород.',
    isPopular: true,
    image: { url: '/demo/agate-1.webp', alt: 'Агат', width: 1400, height: 1050, isPlaceholder: true },
  },
  {
    id: 'm-calcite',
    slug: 'calcite',
    name: 'Кальцит',
    formula: 'CaCO₃',
    about:
      'Карбонат кальция, отличается совершенной спайностью по ромбоэдру и сильным двупреломлением. Многие образцы люминесцируют в ультрафиолете.',
    isPopular: true,
  },
  {
    id: 'm-tourmaline',
    slug: 'tourmaline',
    name: 'Турмалин',
    formula: 'сложный боросиликат',
    about:
      'Группа боросиликатов сложного состава. Кристаллы часто вытянутые, с продольной штриховкой; характерна зональная окраска вдоль и поперёк кристалла.',
    isPopular: true,
  },
  {
    id: 'm-azurite',
    slug: 'azurite',
    name: 'Азурит',
    formula: 'Cu₃(CO₃)₂(OH)₂',
    about:
      'Синий карбонат меди. Со временем может замещаться малахитом, поэтому нередко встречается в срастании с ним.',
    isPopular: false,
  },
  {
    id: 'm-rhodonite',
    slug: 'rhodonite',
    name: 'Родонит',
    formula: 'MnSiO₃',
    about:
      'Силикат марганца розового цвета с чёрными прожилками оксидов марганца. Традиционный поделочный камень.',
    isPopular: false,
  },
  {
    id: 'm-labradorite',
    slug: 'labradorite',
    name: 'Лабрадор',
    formula: 'полевой шпат',
    about:
      'Плагиоклаз с эффектом иризации: при повороте на полированной поверхности появляются синие и зелёные переливы.',
    isPopular: false,
  },
  {
    id: 'm-obsidian',
    slug: 'obsidian',
    name: 'Обсидиан',
    formula: 'вулканическое стекло',
    about:
      'Вулканическое стекло, образующееся при быстром остывании кислой лавы. Характерен раковистый излом.',
    isPopular: false,
  },
  {
    id: 'm-selenite',
    slug: 'selenite',
    name: 'Селенит',
    formula: 'CaSO₄·2H₂O',
    about:
      'Прозрачная разновидность гипса. Мягкий минерал, легко царапается ногтем, требует аккуратного хранения.',
    isPopular: false,
  },
  {
    id: 'm-celestine',
    slug: 'celestine',
    name: 'Целестин',
    formula: 'SrSO₄',
    about: 'Сульфат стронция, обычно голубоватого оттенка. Часто образует жеоды с прозрачными кристаллами.',
    isPopular: false,
  },
  {
    id: 'm-jasper',
    slug: 'jasper',
    name: 'Яшма',
    formula: 'SiO₂',
    about:
      'Плотная кремнистая порода с примесями, определяющими рисунок и окраску. Хорошо принимает полировку.',
    isPopular: false,
  },
  {
    id: 'm-aventurine',
    slug: 'aventurine',
    name: 'Авантюрин',
    formula: 'SiO₂',
    about:
      'Кварцит с включениями слюды или гематита, дающими мерцающий эффект на полированной поверхности.',
    isPopular: false,
  },
  {
    id: 'm-chalcedony',
    slug: 'chalcedony',
    name: 'Халцедон',
    formula: 'SiO₂',
    about: 'Скрытокристаллическая разновидность кварца с восковым блеском и просвечиванием.',
    isPopular: false,
  },
  {
    id: 'm-topaz',
    slug: 'topaz',
    name: 'Топаз',
    formula: 'Al₂SiO₄(F,OH)₂',
    about:
      'Силикат алюминия с фтором. Твёрдость 8 по шкале Мооса, совершенная спайность в одном направлении.',
    isPopular: false,
  },
  {
    id: 'm-garnet',
    slug: 'garnet',
    name: 'Гранат',
    formula: 'группа минералов',
    about:
      'Группа островных силикатов с общим типом структуры. Кристаллы обычно ромбододекаэдрические.',
    isPopular: false,
  },
];

/**
 * Месторождения — справочник для оси навигации №3.
 * Привязка demo-товаров к месторождениям носит демонстрационный характер
 * и подлежит замене на реальные данные заказчика (см. п.61 ТЗ).
 */
export const deposits: Deposit[] = [
  { id: 'd-dalnegorsk', slug: 'dalnegorsk', name: 'Дальнегорск', country: 'Россия', region: 'Приморский край' },
  { id: 'd-dalnegorsk-nikolaevskiy', slug: 'nikolaevskiy', name: 'Николаевский рудник', country: 'Россия', region: 'Приморский край' },
  { id: 'd-ural-polar', slug: 'pripolyarnyy-ural', name: 'Приполярный Урал', country: 'Россия', region: 'Урал' },
  { id: 'd-ural-south', slug: 'yuzhnyy-ural', name: 'Южный Урал', country: 'Россия', region: 'Урал' },
  { id: 'd-khibiny', slug: 'khibiny', name: 'Хибины', country: 'Россия', region: 'Мурманская область' },
  { id: 'd-lovozero', slug: 'lovozero', name: 'Ловозеро', country: 'Россия', region: 'Мурманская область' },
  { id: 'd-dachnoe', slug: 'dalnegorsk-dachnoe', name: 'Дачное', country: 'Россия', region: 'Приморский край' },
  { id: 'd-karelia', slug: 'kareliya', name: 'Карелия', country: 'Россия', region: 'Карелия' },
  { id: 'd-altai', slug: 'altay', name: 'Алтай', country: 'Россия', region: 'Алтай' },
  { id: 'd-minas', slug: 'minas-gerais', name: 'Минас-Жерайс', country: 'Бразилия', region: 'Минас-Жерайс' },
  { id: 'd-navajun', slug: 'navahun', name: 'Навахун', country: 'Испания', region: 'Ла-Риоха' },
  { id: 'd-katanga', slug: 'katanga', name: 'Катанга', country: 'ДР Конго', region: 'Катанга' },
  { id: 'd-madagascar', slug: 'madagaskar', name: 'Мадагаскар', country: 'Мадагаскар' },
  { id: 'd-morocco', slug: 'marokko', name: 'Марокко', country: 'Марокко' },
  { id: 'd-mexico', slug: 'meksika', name: 'Мексика', country: 'Мексика' },
];

/** Цвет — вход в каталог для новичка, который не знает названий минералов */
export const colors: Color[] = [
  { id: 'violet', name: 'Фиолетовый', hex: '#7C4DA8' },
  { id: 'green', name: 'Зелёный', hex: '#3F8F5B' },
  { id: 'blue', name: 'Синий', hex: '#2C5FA8' },
  { id: 'turquoise', name: 'Бирюзовый', hex: '#2AB8C6' },
  { id: 'white', name: 'Белый', hex: '#EDEFEF' },
  { id: 'black', name: 'Чёрный', hex: '#22282A' },
  { id: 'yellow', name: 'Жёлтый', hex: '#D8A93A' },
  { id: 'orange', name: 'Оранжевый', hex: '#D2762F' },
  { id: 'pink', name: 'Розовый', hex: '#C9718A' },
  { id: 'red', name: 'Красный', hex: '#B03A32' },
  { id: 'brown', name: 'Коричневый', hex: '#7A5A3E' },
  { id: 'gray', name: 'Серый', hex: '#8A9294' },
];

export const featureLabels: Record<string, string> = {
  uv: 'Свечение в УФ',
  phantom: 'Фантомы, зональность',
  inclusion: 'Включения',
  habit: 'Необычный габитус',
  twin: 'Двойники',
};

// --- Индексы для быстрого доступа ---

export const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
export const categoryById = new Map(categories.map((c) => [c.id, c]));
export const mineralById = new Map(minerals.map((m) => [m.id, m]));
export const mineralBySlug = new Map(minerals.map((m) => [m.slug, m]));
export const depositById = new Map(deposits.map((d) => [d.id, d]));
export const depositBySlug = new Map(deposits.map((d) => [d.slug, d]));
export const colorById = new Map(colors.map((c) => [c.id, c]));

/** Подкатегории данной категории */
export function childCategories(parentId: string): Category[] {
  return categories.filter((c) => c.parentId === parentId).sort((a, b) => a.order - b.order);
}

/** Категория + все её потомки — для фильтрации товаров по ветке дерева */
export function categoryBranchIds(categoryId: string): string[] {
  const ids = [categoryId];
  for (const child of categories.filter((c) => c.parentId === categoryId)) {
    ids.push(...categoryBranchIds(child.id));
  }
  return ids;
}

/** Хлебные крошки от корня до указанной категории */
export function categoryPath(categoryId: string): Category[] {
  const path: Category[] = [];
  let current = categoryById.get(categoryId);
  while (current) {
    path.unshift(current);
    current = current.parentId ? categoryById.get(current.parentId) : undefined;
  }
  return path;
}
