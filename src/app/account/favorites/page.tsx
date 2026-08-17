import type { Metadata } from 'next';
import { AccountShell } from '@/components/account/AccountShell';
import { FavoritesView } from '@/components/favorites/FavoritesView';

export const metadata: Metadata = {
  title: 'Избранное',
  robots: { index: false, follow: false },
};

export default function AccountFavoritesPage() {
  return (
    <div className="container-page pb-16 pt-10">
      <AccountShell title="Избранное">
        <FavoritesView />
      </AccountShell>
    </div>
  );
}
