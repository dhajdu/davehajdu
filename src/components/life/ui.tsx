// Shared /life UI primitives. Site tokens only (globals.css @theme): navy, blue,
// magenta, mint, light-gray, body-text, muted, border. White background, no dark mode.
import Link from 'next/link';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`border border-border rounded-xl p-4 bg-white ${className}`}>
      {title && <h2 className="text-xs font-semibold text-muted mb-3">{title}</h2>}
      {children}
    </section>
  );
}

type ChipTone = 'gray' | 'navy' | 'blue' | 'mint' | 'magenta';
const chipTones: Record<ChipTone, string> = {
  gray: 'bg-light-gray text-navy',
  navy: 'bg-navy text-white',
  blue: 'bg-blue text-white',
  mint: 'bg-mint text-navy',
  magenta: 'bg-magenta text-white',
};

export function Chip({ children, tone = 'gray' }: { children: React.ReactNode; tone?: ChipTone }) {
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${chipTones[tone]}`}>
      {children}
    </span>
  );
}

export function ButtonLink({ href, children, primary }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={`inline-block text-xs font-semibold px-3 py-1.5 rounded-lg border-[1.5px] ${
        primary ? 'bg-blue border-blue text-white' : 'bg-white border-navy text-navy'
      }`}
    >
      {children}
    </Link>
  );
}

export const buttonClass = 'inline-block text-xs font-semibold px-3 py-1.5 rounded-lg border-[1.5px] bg-white border-navy text-navy disabled:opacity-50';
export const primaryButtonClass = 'inline-block text-xs font-semibold px-3 py-1.5 rounded-lg border-[1.5px] bg-blue border-blue text-white disabled:opacity-50';

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted border border-dashed border-border rounded-xl p-6 text-center">{children}</p>;
}
