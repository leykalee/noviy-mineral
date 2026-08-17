// ESLint 9 flat config. eslint-config-next 16 уже отдаёт flat-конфиг,
// поэтому обёртка FlatCompat не нужна (и ломается на плагине react).
import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

const config = [
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // Подчёркивание = «параметр объявлен по контракту интерфейса, но пока не нужен».
      // Так помечены аргументы в заглушках провайдеров СДЭК и CDEK PAY.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'drizzle/**'],
  },
];

export default config;
