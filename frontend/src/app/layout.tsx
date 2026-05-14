import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Vodys — Study Smarter',
    template: '%s | Vodys',
  },
  description:
    'Vodys is a modern study management platform to organize your subjects, tasks, and study sessions with Pomodoro tracking.',
  keywords: ['study', 'productivity', 'pomodoro', 'task management', 'education'],
  authors: [{ name: 'Vodys Team' }],
  creator: 'Vodys',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Vodys',
    title: 'Vodys — Study Smarter',
    description: 'Organize your studies. Track your progress. Achieve your goals.',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0e1a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
