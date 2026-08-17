# Деплой на Netlify

## Почему не статический экспорт

Сайт нельзя выложить как набор HTML-файлов: каталог фильтруется и отдаётся
постранично на сервере, а поиск, расчёт доставки и оформление заказа — это
API-роуты. Поэтому используется официальный **Next.js Runtime** Netlify
(`@netlify/plugin-nextjs`), который поддерживает Next.js 16.

Конфигурация уже в репозитории — `netlify.toml`.

---

## Репозиторий

Код лежит здесь: **https://github.com/leykalee/noviy-mineral** (ветка `main`).

## Вариант 1. Через интерфейс Netlify

1. Открыть **https://app.netlify.com** и войти — удобнее сразу кнопкой
   **Log in with GitHub**, тогда доступ к репозиториям выдастся автоматически.
2. **Add new site** (или **Add new project**) → **Import an existing project**.
3. **Deploy with GitHub** → при первом входе нажать **Authorize Netlify**.
   Если репозитория нет в списке — **Configure the Netlify app on GitHub**
   и дать доступ к `noviy-mineral`.
4. Выбрать репозиторий **noviy-mineral**.
5. Ничего не менять: команда сборки, папка публикации и версия Node уже заданы
   в `netlify.toml`. Нажать **Deploy**.
   Первая сборка занимает 2–4 минуты.
6. После сборки Netlify выдаст адрес вида `https://<случайное-имя>.netlify.app`.
7. **Site configuration → Environment variables → Add a variable** →
   `NEXT_PUBLIC_SITE_URL` = адрес из шага 6.
8. **Deploys → Trigger deploy → Clear cache and deploy site** — чтобы canonical,
   OpenGraph и `sitemap.xml` пересобрались с боевым адресом.

## Вариант 2. Через CLI

```bash
npm i -g netlify-cli
netlify login
netlify init          # привязать сайт
netlify env:set NEXT_PUBLIC_SITE_URL https://<ваш-домен>
netlify deploy --build            # черновой деплой с превью-ссылкой
netlify deploy --build --prod     # публикация
```

---

## Переменные окружения на Netlify

Обязательная одна:

| Переменная | Значение |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | адрес сайта, например `https://noviy-mineral.netlify.app` |

Без неё canonical-ссылки, OpenGraph и `sitemap.xml` будут указывать на localhost.

Остальные (`DATABASE_URL`, ключи СДЭК, CDEK PAY, почты) добавляются, когда
заказчик передаст доступы. Пока их нет, сайт работает на демонстрационных
провайдерах и честно сообщает об этом в интерфейсе.

**Ключи задаются только в панели Netlify.** В репозиторий `.env.local` не
коммитится (он в `.gitignore`), во frontend-бандл секреты не попадают:
все обращения к ним изолированы в `src/services/*`, помеченных `server-only`.

---

## После первого деплоя

1. Открыть `/` — проверить, что логотип и фотографии загрузились.
2. Открыть `/catalog/minerals?mineral=amethyst` — фильтр должен примениться
   сразу из URL.
3. Открыть `/sitemap.xml` и `/robots.txt` — в них должен стоять боевой домен,
   а не localhost. Если стоит localhost, значит не задан `NEXT_PUBLIC_SITE_URL`.
4. Проверить `/api/search/suggest?q=флюорит` — должен вернуться JSON.

---

## Смена домена

После привязки собственного домена нужно:

1. Обновить `NEXT_PUBLIC_SITE_URL` на новый адрес.
2. Пересобрать сайт (Netlify → **Trigger deploy → Clear cache and deploy site**) —
   canonical и sitemap пересоберутся с новым доменом.

---

## Ограничения текущей версии в проде

- **Заказы не переживают перезапуск.** Они лежат в памяти процесса
  (`src/lib/orders-store.ts`) и в localStorage браузера покупателя. До подключения
  БД полагаться на них как на учётную систему нельзя.
- **Письма не уходят.** Пока не заданы `EMAIL_*`, уведомление о заказе только
  пишется в лог функции.
- **Оплата не проводится.** Заказ создаётся со статусом «ожидает оплаты».

Всё это снимается подключением боевых интеграций и БД — интерфейсы уже готовы.
