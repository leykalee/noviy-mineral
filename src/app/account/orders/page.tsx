import type { Metadata } from 'next';
import { AccountShell } from '@/components/account/AccountShell';
import { OrdersList } from '@/components/account/OrdersList';

export const metadata: Metadata = {
  title: 'Мои заказы',
  robots: { index: false, follow: false },
};

export default function AccountOrdersPage() {
  return (
    <div className="container-page pb-16 pt-10">
      <AccountShell title="Мои заказы">
        <OrdersList />
      </AccountShell>
    </div>
  );
}
