import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog — AI, Leadership, and the Other 50% | Dave Hajdu',
  description:
    'Writing on AI strategy, leadership, high-performance culture, and doing business in Vietnam. Field notes from helping organizations turn AI into real outcomes.',
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
