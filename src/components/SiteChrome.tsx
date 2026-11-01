'use client';

import { usePathname } from 'next/navigation';

// Hides the public site's navbar and footer inside /life, which has its own shell.
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/life')) return null;
  return <>{children}</>;
}
