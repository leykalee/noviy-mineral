import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { getPaymentProvider } from '@/services';

export const metadata: Metadata = {
  title: 'Оформление заказа',
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  // способы оплаты приходят от провайдера, а не хардкодятся в форме
  const paymentMethods = await getPaymentProvider().getMethods();

  return (
    <div className="container-page pb-16 pt-6">
      <Breadcrumbs
        items={[
          { label: 'Главная', href: '/' },
          { label: 'Корзина', href: '/cart' },
          { label: 'Оформление' },
        ]}
      />
      <h1 className="mb-8 mt-4 text-[30px] font-semibold tracking-[-0.015em] sm:text-[34px]">
        Оформление заказа
      </h1>
      <CheckoutForm paymentMethods={paymentMethods} />
    </div>
  );
}
