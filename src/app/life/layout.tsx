import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '/life',
  robots: { index: false, follow: false },
};

export default function LifeRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
