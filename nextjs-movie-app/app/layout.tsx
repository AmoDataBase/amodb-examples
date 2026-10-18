import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'amodb movie app', template: '%s | amodb movie app' },
  description: 'A small movie browser built with Next.js server components and the amodb API.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            amodb movie app
          </Link>
        </header>
        <main>{children}</main>
        <footer className="site-footer">Data from the amodb API. Works with any TMDB v3 compatible base URL.</footer>
      </body>
    </html>
  );
}
