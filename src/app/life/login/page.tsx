import { connection } from 'next/server';
import LoginForm from './LoginForm';

export default async function LifeLoginPage() {
  // Render per request: the form creates a Supabase client, which needs env
  // vars that are not available when prerendering at build time.
  await connection();
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="w-full max-w-sm border border-border rounded-xl p-6">
        <div className="text-lg font-bold text-navy mb-1">/life</div>
        <p className="text-sm text-muted mb-6">Private. Sign in to continue.</p>
        <LoginForm />
      </div>
    </div>
  );
}
