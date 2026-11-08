import type { Metadata } from 'next';
import { requireOwner } from '@/lib/life/auth';
import { PageHeader, Card } from '@/components/life/ui';
import ChangePasswordForm from './ChangePasswordForm';

export const metadata: Metadata = { title: 'Profile', robots: { index: false, follow: false } };

export default async function SettingsPage() {
  const { user } = await requireOwner();
  const email = user.email ?? '';

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Profile" subtitle="How you get into /life" />

      <Card title="Signed in as">
        <p className="text-sm text-body-text">{email}</p>
      </Card>

      <Card title="Change password">
        <ChangePasswordForm email={email} />
      </Card>
    </div>
  );
}
