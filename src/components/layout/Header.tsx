import { Logo } from '@/components/brand/Logo';
import { HeaderActions } from '@/components/layout/HeaderActions';
import { MegaMenu } from '@/components/layout/MegaMenu';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { PrimaryNav } from '@/components/layout/PrimaryNav';
import { SearchBar } from '@/components/search/SearchBar';

/**
 * Шапка (п.9 ТЗ).
 *
 * Desktop: логотип · крупный поиск · избранное / кабинет / корзина, ниже — навигация с «Каталогом».
 * Mobile: компактная строка + поиск отдельной строкой, каталог уходит в drawer.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-[6px]">
      <a
        href="#main"
        className="sr-only-focusable absolute left-4 top-3 z-50 rounded-[var(--radius-sm)] bg-brand px-4 py-2 text-[14px] text-white"
      >
        Перейти к содержимому
      </a>

      <div className="container-page">
        {/* верхняя строка */}
        <div className="flex h-16 items-center gap-3 lg:h-[76px] lg:gap-8">
          <MobileMenu />
          <Logo className="shrink-0" size="sm" />

          <div className="ml-auto hidden min-w-0 flex-1 lg:ml-0 lg:block">
            <SearchBar />
          </div>

          <div className="ml-auto shrink-0 lg:ml-0">
            <HeaderActions />
          </div>
        </div>

        {/* поиск на мобильных — отдельной строкой, всегда на виду */}
        <div className="pb-3 lg:hidden">
          <SearchBar compact />
        </div>

        {/* навигация — только desktop */}
        <nav aria-label="Основная навигация" className="hidden h-14 items-center gap-1 lg:flex">
          <MegaMenu />
          <PrimaryNav />
        </nav>
      </div>
    </header>
  );
}
