// Shared /life UI primitives, styled by src/app/life/life.css (the Edge8 team
// portal look: white cards with a hairline border and soft shadow on a grey canvas).
import Link from 'next/link';

export function PageHeader({ title, subtitle, eyebrow, actions }: { title: string; subtitle?: string; eyebrow?: string; actions?: React.ReactNode }) {
  return (
    <div className="life-page-head">
      <div>
        {eyebrow && <div className="life-eyebrow">{eyebrow}</div>}
        <h1 className="life-page-title">{title}</h1>
        {subtitle && <p className="life-page-sub">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`life-card ${className}`}>
      {title && <h2 className="life-card-title">{title}</h2>}
      {children}
    </section>
  );
}

type ChipTone = 'gray' | 'navy' | 'blue' | 'mint' | 'magenta';

export function Chip({ children, tone = 'gray' }: { children: React.ReactNode; tone?: ChipTone }) {
  return <span className={`life-badge${tone === 'gray' ? '' : ` is-${tone}`}`}>{children}</span>;
}

export function ButtonLink({ href, children, primary }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <Link href={href} className={primary ? 'life-btn is-primary' : 'life-btn'}>
      {children}
    </Link>
  );
}

export const buttonClass = 'life-btn';
export const primaryButtonClass = 'life-btn is-primary';

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="life-empty">{children}</p>;
}
