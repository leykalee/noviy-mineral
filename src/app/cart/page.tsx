import type { Metadata } from 'next';
import { CartView } from '@/components/cart/CartView';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Корзина',
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <div className="container-page pb-16 pt-6">
      <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Корзина' }]} />
      <h1 className="mb-8 mt-4 text-[30px] font-semibold tracking-[-0.015em] sm:text-[34px]">
        Корзина
      </h1>
      <CartView />
    </div>
  );
}
