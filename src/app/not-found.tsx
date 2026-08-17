import { ButtonLink } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="tnum text-[56px] font-semibold leading-none text-brand-soft">404</p>
      <h1 className="mt-4 text-[26px] font-semibold">Страница не найдена</h1>
      <p className="mx-auto mt-3 max-w-[48ch] text-[16px] text-muted-foreground">
        Возможно, экземпляр уже продан и страница переехала, либо в адресе опечатка.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/catalog" size="lg">
          Смотреть каталог
        </ButtonLink>
        <ButtonLink href="/" size="lg" variant="secondary">
          На главную
        </ButtonLink>
      </div>
      <p className="mt-8 text-[15px] text-muted-foreground">
        <Icon name="search" size={17} className="mr-1.5 inline align-text-bottom" />
        Или найдите нужный минерал через поиск в шапке.
      </p>
    </div>
  );
}
