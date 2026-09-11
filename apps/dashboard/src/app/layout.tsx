import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { Inter } from 'next/font/google';
import { RadixDirectionProvider } from '@/components/RadixDirectionProvider';
import { CHUNK_RELOAD_SCRIPT } from '@/utils/chunkReload';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://my.befroosh.com'),
  title: 'Befroosh',
  description: 'دایرکت هوشمند اینستاگرام',
  icons: {
    icon: '/images/favicon/favicon.ico',
    apple: '/images/favicon/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'بفروش — دایرکت هوشمند اینستاگرام',
    description: 'دایرکت هوشمند اینستاگرام',
    url: 'https://my.befroosh.com',
    siteName: 'بفروش',
    images: [
      {
        url: '/images/favicon/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'fa_IR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'بفروش',
    description: 'دایرکت هوشمند اینستاگرام',
    images: ['/images/favicon/og-image.jpg'],
  },
  other: {
    'theme-color': '#ffffff',
    'msapplication-TileColor': '#ffffff',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  const className = locale === 'fa' ? 'font-Yekan antialiased' : `${inter.className} antialiased`;

  return (
    <html lang={locale} dir={locale === 'fa' ? 'rtl' : 'ltr'} className={className}>
      <head>
        {/* Must run before any chunk to catch one that fails to load — see utils/chunkReload.ts */}
        <script dangerouslySetInnerHTML={{ __html: CHUNK_RELOAD_SCRIPT }} />
      </head>
      <body>
        <RadixDirectionProvider dir={locale === 'fa' ? 'rtl' : 'ltr'}>
          {children}
        </RadixDirectionProvider>
      </body>
    </html>
  );
}
