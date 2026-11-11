import type { ReactNode } from 'react';

// Shared shell for the privacy and terms pages: a short dark header under the
// navbar, then plain readable sections.
export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <section className="bg-[#04102D]">
        <div className="max-w-[760px] mx-auto px-8 sm:px-10 pt-36 pb-14">
          <h1 className="text-white font-black tracking-[-0.03em] text-[40px] leading-[1.05]">{title}</h1>
          <p className="text-white/50 text-[13px] mt-4">Last updated {updated}</p>
        </div>
      </section>
      <section className="bg-white">
        <div className="max-w-[760px] mx-auto px-8 sm:px-10 py-14 space-y-10 text-[#04102D]/80 text-[15px] leading-[1.7]">{children}</div>
      </section>
    </>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-[#04102D] font-bold text-[19px] tracking-[-0.01em]">{heading}</h2>
      {children}
    </div>
  );
}
