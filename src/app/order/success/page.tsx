import type { Metadata } from 'next';
import { OrderSuccess } from '@/components/checkout/OrderSuccess';

export const metadata: Metadata = {
  title: 'Заказ оформлен',
  robots: { index: false, follow: false },
};

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ number?: string }>;
}) {
  const { number } = await searchParams;

  return (
    <div className="container-page pb-16 pt-10">
      <OrderSuccess number={number ?? null} />
    </div>
  );
}
