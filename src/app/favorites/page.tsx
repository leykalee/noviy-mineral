import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { FavoritesView } from '@/components/favorites/FavoritesView';

export const metadata: Metadata = {
  title: 'Избранное',
  robots: { index: false, follow: false },
};

export default function FavoritesPage() {
  return (
    <div className="container-page pb-16 pt-6">
      <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Избранное' }]} />
      <h1 className="mb-8 mt-4 text-[30px] font-semibold tracking-[-0.015em] sm:text-[34px]">
        Избранное
      </h1>
      <FavoritesView />
    </div>
  );
}
