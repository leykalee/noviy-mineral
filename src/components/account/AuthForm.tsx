'use client';

import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { Field, inputClass } from '@/components/checkout/Field';
import { useStore } from '@/components/store/StoreProvider';
import { cx } from '@/lib/cx';

/**
 * Вход, регистрация и восстановление доступа (п.44 ТЗ).
 *
 * ⚠️ Аутентификации на сервере в прототипе нет: сессия хранится в браузере.
 * Компонент прямо сообщает об этом, чтобы демо не выглядело настоящей защитой.
 * При подключении бэкенда меняется только обработчик submit.
 */

type Mode = 'login' | 'register' | 'recover';

const titles: Record<Mode, string> = {
  login: 'Вход',
  register: 'Регистрация',
  recover: 'Восстановление доступа',
};

export function AuthForm() {
  const { login } = useStore();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Проверьте адрес электронной почты';
    }
    if (mode === 'register' && name.trim().length < 2) {
      next.name = 'Укажите имя';
    }
    if (mode !== 'recover' && password.length < 6) {
      next.password = 'Не короче 6 символов';
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (mode === 'recover') {
      setSent(true);
      return;
    }

    login({
      id: `u-${email.trim().toLowerCase()}`,
      email: email.trim().toLowerCase(),
      name: mode === 'register' ? name.trim() : email.trim().split('@')[0],
    });
  };

  if (sent) {
    return (
      <div className="mx-auto max-w-[440px] rounded-[var(--radius-md)] border border-border bg-surface p-6 text-center">
        <Icon name="check" size={28} className="mx-auto text-success" />
        <h2 className="mt-3 text-[18px] font-semibold">Проверьте почту</h2>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Если аккаунт с адресом {email} существует, мы отправим на него ссылку для восстановления.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setMode('login');
          }}
          className="mt-4 text-[15px] font-medium text-brand hover:underline"
        >
          Вернуться ко входу
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[440px]">
      <div className="mb-6 flex gap-1 rounded-[var(--radius-sm)] bg-muted p-1">
        {(['login', 'register'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              setErrors({});
            }}
            className={cx(
              'h-10 flex-1 rounded-[var(--radius-xs)] text-[15px] font-medium transition-colors duration-[var(--dur-fast)]',
              mode === value ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            {titles[value]}
          </button>
        ))}
      </div>

      <form onSubmit={submit} noValidate className="space-y-4">
        {mode === 'register' && (
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
        )}

        <Field label="Электронная почта" required error={errors.email}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={inputClass(invalid)}
            />
          )}
        </Field>

        {mode !== 'recover' && (
          <Field label="Пароль" required error={errors.password}>
            {({ id, describedBy, invalid }) => (
              <input
                id={id}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                className={inputClass(invalid)}
              />
            )}
          </Field>
        )}

        <Button type="submit" size="lg" fullWidth>
          {mode === 'register' ? 'Зарегистрироваться' : 'Войти'}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode('recover');
          setErrors({});
        }}
        className="mt-4 block w-full text-center text-[15px] text-brand hover:underline"
      >
        Забыли пароль?
      </button>

      <p className="mt-6 flex gap-2.5 rounded-[var(--radius-sm)] bg-warning-soft px-4 py-3 text-[14px] text-warning">
        <Icon name="info" size={17} className="mt-0.5 shrink-0" />
        <span>
          В прототипе аккаунт создаётся только в этом браузере — серверной проверки пароля пока нет.
          Избранное и заказы при входе переносятся из гостевого режима.
        </span>
      </p>
    </div>
  );
}
