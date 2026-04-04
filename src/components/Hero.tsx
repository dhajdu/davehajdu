'use client';

import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative w-full min-h-screen flex items-center bg-[#04102D] overflow-hidden">

      {/* Ambient blue glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 20% 55%, rgba(40,123,232,0.14) 0%, transparent 65%)',
        }}
      />

      {/* Ghost "50%" typographic element */}
      <div
        aria-hidden="true"
        className="absolute right-[-20px] bottom-[-40px] font-black leading-none select-none pointer-events-none text-white/[0.04]"
        style={{ fontSize: 'clamp(180px, 26vw, 380px)', letterSpacing: '-0.06em' }}
      >
        50%
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1080px] mx-auto px-8 sm:px-5 pt-32 pb-24 w-full">

        {/* Eyebrow */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-8">
          {['AI Keynote Speaker', 'Consultant', 'Author'].map((label, i) => (
            <span key={i} className="flex items-center gap-5">
              {i > 0 && <span className="w-1 h-1 rounded-full bg-[#6FF2C1]/40 inline-block" />}
              <span className="text-[#6FF2C1] text-[11px] font-bold tracking-[0.13em] uppercase">
                {label}
              </span>
            </span>
          ))}
        </div>

        {/* Main headline */}
        <h1
          className="text-white font-black leading-[1.05] tracking-[-0.045em] mb-4"
          style={{ fontSize: 'clamp(52px, 8.5vw, 96px)', maxWidth: 680 }}
        >
          Dave Hajdu
        </h1>
        <p
          className="text-[#6FF2C1] font-black leading-none tracking-[-0.03em] mb-8"
          style={{ fontSize: 'clamp(22px, 3.5vw, 40px)' }}
        >
          Chief AI Officer
        </p>

        {/* Subtext */}
        <p
          className="text-white/55 leading-relaxed font-normal mb-12"
          style={{ fontSize: 'clamp(17px, 2vw, 20px)', maxWidth: 500 }}
        >
          Where business fluency meets technical depth, the rare combination
          that makes AI actually work inside organizations.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/speaker-topics"
            className="inline-block bg-[#6FF2C1] text-[#04102D] px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:bg-[#5de8b3] transition-colors"
          >
            Book a Keynote
          </Link>
          <Link
            href="/ai-in-business"
            className="inline-block border border-white/25 text-white px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:border-white/50 hover:bg-white/5 transition-all"
          >
            Schedule a Consultation
          </Link>
        </div>
      </div>
    </section>
  );
}
