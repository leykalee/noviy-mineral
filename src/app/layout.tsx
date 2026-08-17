import type { Metadata, Viewport } from 'next';
import { Onest } from 'next/font/google';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { StoreProvider } from '@/components/store/StoreProvider';
import { brandAssets, brandColors } from '@/config/brand';
import { storeConfig } from '@/config/store';
import './globals.css';

/**
 * Одна гарнитура на весь сайт (п.51 ТЗ): Onest — современный гротеск
 * с качественной кириллицей и ровными цифрами, что важно для цен и артикулов.
 */
const onest = Onest({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-onest',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: `${storeConfig.name} — ${storeConfig.descriptor.toLowerCase()}`,
    template: `%s — ${storeConfig.name}`,
  },
  description:
    'Коллекционные минералы, изделия из натурального камня, украшения, книги и сопутствующие товары. Каждый коллекционный образец продаётся отдельным экземпляром.',
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: storeConfig.name,
    images: [{ url: brandAssets.avatarLarge, width: 1200, height: 1200, alt: storeConfig.name }],
  },
  icons: {
    icon: [{ url: '/brand/icon-64.png', sizes: '64x64', type: 'image/png' }],
    apple: [{ url: brandAssets.avatar, sizes: '512x512', type: 'image/png' }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: brandColors.deep,
  width: 'device-width',
  initialScale: 1,
  // масштабирование не блокируем — это требование доступности
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={onest.variable}>
      <body>
        <StoreProvider>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
