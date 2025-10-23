import type { Metadata } from 'next';
import Image from 'next/image';

import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'XRPL Wallet Integration example',
  description: 'Backend-generated XRPL wallet approval flow for web applications.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <header className="flex h-[140px] items-center justify-center">
          <Image
            priority
            src="/xrpl-logo-white.svg"
            alt="XRP Ledger"
            width={320}
            height={96}
          />
        </header>
        {children}
      </body>
    </html>
  );
}
