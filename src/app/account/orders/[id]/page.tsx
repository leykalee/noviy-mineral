import type { Metadata } from 'next';
import { AccountShell } from '@/components/account/AccountShell';
import { OrderDetails } from '@/components/account/OrdersList';

export const metadata: Metadata = {
  title: 'Заказ',
  robots: { index: false, follow: false },
};

export default async function AccountOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="container-page pb-16 pt-10">
      <AccountShell title="Заказ">
        <OrderDetails number={decodeURIComponent(id)} />
      </AccountShell>
    </div>
  );
}
