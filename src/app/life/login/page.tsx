import { connection } from 'next/server';
import { Manrope } from 'next/font/google';
import LoginForm from './LoginForm';
import '../life.css';

const manrope = Manrope({ subsets: ['latin'], variable: '--life-font' });

export default async function LifeLoginPage() {
  // Render per request: the form creates a Supabase client, which needs env
  // vars that are not available when prerendering at build time.
  await connection();
  return (
    <div className={`life-shell ${manrope.variable} items-center justify-center px-4`}>
      <div className="life-card w-full max-w-sm" style={{ padding: 28 }}>
        <div className="flex items-center gap-2.5 mb-5">
          <span className="life-brand-mark">L</span>
          <div>
            <div className="life-page-title" style={{ fontSize: 20 }}>/life</div>
            <p className="text-sm" style={{ color: 'var(--life-muted)' }}>Private. Sign in to continue.</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
