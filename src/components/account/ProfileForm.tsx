'use client';

import { useState } from 'react';
import type { User } from '@/types';
import { Button } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { Field, inputClass } from '@/components/checkout/Field';
import { useStore } from '@/components/store/StoreProvider';

/**
 * Профиль и адреса (п.41 ТЗ).
 * Данные сохраняются в аккаунт браузера — серверного профиля в прототипе нет.
 */
export function ProfileForm() {
  const { user, hydrated } = useStore();

  if (!hydrated || !user) return null;

  // key по пользователю: при смене аккаунта форма пересоздаётся с новыми
  // начальными значениями, вместо синхронизации состояния через эффект
  return <ProfileFields key={user.id} user={user} />;
}

function ProfileFields({ user }: { user: User }) {
  const { login } = useStore();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = 'Укажите имя';
    if (phone && !/^\+?[\d\s()-]{10,20}$/.test(phone.trim())) next.phone = 'Проверьте номер телефона';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    login({ ...user, name: name.trim(), phone: phone.trim() || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 2600);
  };

  return (
    <form onSubmit={submit} noValidate className="max-w-[440px] space-y-4">
      <Field label="Имя" required error={errors.name}>
        {({ id, describedBy, invalid }) => (
          <input
            id={id}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            aria-describedby={describedBy}
            aria-invalid={invalid}
            className={inputClass(invalid)}
          />
        )}
      </Field>

      <Field label="Телефон" error={errors.phone}>
        {({ id, describedBy, invalid }) => (
          <input
            id={id}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            aria-describedby={describedBy}
            aria-invalid={invalid}
            className={inputClass(invalid)}
          />
        )}
      </Field>

      <Field label="Электронная почта" hint="Адрес входа изменить нельзя">
        {({ id }) => (
          <input id={id} value={user.email} disabled className={`${inputClass(false)} opacity-60`} />
        )}
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit">Сохранить</Button>
        <span
          aria-live="polite"
          className={`flex items-center gap-1.5 text-[15px] text-success transition-opacity duration-[var(--dur)] ${saved ? 'opacity-100' : 'opacity-0'}`}
        >
          <Icon name="check" size={17} />
          Сохранено
        </span>
      </div>
    </form>
  );
}
