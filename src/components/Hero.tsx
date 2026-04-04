'use client';

import Link from 'next/link';
import Image from 'next/image';

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

      {/* Content */}
      <div className="relative z-10 max-w-[1080px] mx-auto px-8 sm:px-5 pt-32 pb-24 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Left: Text */}
          <div className="flex-1 min-w-0">
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
              className="text-white font-black leading-[1.0] tracking-[-0.045em] mb-7"
              style={{ fontSize: 'clamp(52px, 8.5vw, 96px)' }}
            >
              The Other
              <br />
              <span className="text-[#6FF2C1]">50%.</span>
            </h1>

            {/* Subtext */}
            <p
              className="text-white/55 leading-relaxed font-normal mb-12"
              style={{ fontSize: 'clamp(17px, 2vw, 20px)', maxWidth: 460 }}
            >
              Where business fluency meets technical depth — the rare combination
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

          {/* Right: Dave's photo */}
          <div className="hidden lg:flex flex-shrink-0 items-end justify-center" style={{ width: 380 }}>
            <div className="relative w-full" style={{ height: 520 }}>
              {/* Glow behind photo */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse 80% 60% at 50% 80%, rgba(40,123,232,0.18) 0%, transparent 70%)',
                }}
              />
              <Image
                src="/images/dave-hero.jpeg"
                alt="Dave Hajdu speaking on stage"
                fill
                className="object-cover object-top rounded-2xl"
                style={{ objectPosition: 'center 10%' }}
                priority
              />
              {/* Subtle bottom fade so photo blends into dark bg */}
              <div
                className="absolute bottom-0 left-0 right-0 h-24 rounded-b-2xl pointer-events-none"
                style={{ background: 'linear-gradient(to top, #04102D 0%, transparent 100%)' }}
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
