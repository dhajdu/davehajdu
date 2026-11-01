import type { Metadata } from 'next';
import { PageHeader } from '@/components/life/ui';
import AskChat from '@/components/life/ask/AskChat';

export const metadata: Metadata = { title: 'Ask', robots: { index: false, follow: false } };

export default function AskPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Ask" subtitle="Plain-English questions, answered from your own records with the sources linked." />
      <AskChat />
    </div>
  );
}
