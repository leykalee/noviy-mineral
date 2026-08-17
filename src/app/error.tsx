'use client';

import { useEffect } from 'react';
import { Button, ButtonLink } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app] необработанная ошибка', error);
  }, [error]);

  return (
    <div className="container-page py-24 text-center">
      <Icon name="alert" size={40} className="mx-auto text-warning" />
      <h1 className="mt-4 text-[26px] font-semibold">Страница не загрузилась</h1>
      <p className="mx-auto mt-3 max-w-[48ch] text-[16px] text-muted-foreground">
        Мы уже знаем о проблеме. Попробуйте обновить — обычно это помогает.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={reset}>
          Обновить
        </Button>
        <ButtonLink href="/" size="lg" variant="secondary">
          На главную
        </ButtonLink>
      </div>
    </div>
  );
}
