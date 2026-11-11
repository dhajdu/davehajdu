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
    <div className={`life-shell ${manrope.variable}`}>
      <LoginForm />
    </div>
  );
}
