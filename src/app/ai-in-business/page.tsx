import Link from 'next/link';
import Image from 'next/image';

const services = [
  {
    title: 'Automated AI Agents',
    description:
      'Transform your business with AI-powered agents that handle repetitive tasks, surface insights, and act autonomously — so your team can focus on what only humans can do.',
    accent: '#287BE8',
  },
  {
    title: 'AI & Data Layers',
    description:
      'Build strong foundations for AI applications. Clean data, smart architecture, and the right integrations turn raw information into a genuine competitive advantage.',
    accent: '#6FF2C1',
  },
  {
    title: 'Business Development',
    description:
      'Design and implement AI-powered business processes that scale. From lead generation to client delivery, find the workflows where AI creates the most leverage.',
    accent: '#287BE8',
  },
  {
    title: 'Leadership & Growth',
    description:
      'Equip business leaders with the tools, mindset, and frameworks to lead AI adoption — not just adopt AI tools. The goal is a team that thinks in systems.',
    accent: '#6FF2C1',
  },
  {
    title: 'Goal Setting & Performance',
    description:
      'Adopt proven goal-setting strategies that pair human ambition with AI execution. Track, iterate, and compound results faster than ever before.',
    accent: '#287BE8',
  },
  {
    title: 'Technology Integration',
    description:
      'Maximize efficiency by integrating the right technology stack for your business stage. No bloat, no shiny-object chasing — just tools that compound your output.',
    accent: '#6FF2C1',
  },
];

const stats = [
  { value: '$9.5M', label: 'Raised — led by Baseline Ventures' },
  { value: '25+', label: 'Years in business & technology' },
  { value: '15+', label: 'Countries worked in' },
  { value: '500+', label: 'Leaders trained in AI' },
];

export default function AIInBusinessPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative bg-[#04102D] overflow-hidden min-h-[520px] flex items-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#04102D] via-[#04102D]/85 to-[#04102D]/30 z-10" />
          <Image
            src="/images/dave-panel.jpeg"
            alt="Dave Hajdu AI workshop panel"
            fill
            className="object-cover object-center opacity-55"
            priority
          />
        </div>

        {/* Ambient glow */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 70% at 15% 55%, rgba(40,123,232,0.12) 0%, transparent 65%)',
          }}
        />

        <div className="relative z-20 max-w-[1080px] mx-auto px-8 sm:px-5 pt-32 pb-24 w-full">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-8">
            {['AI Consultant', 'Strategist', 'Operator'].map((label, i) => (
              <span key={i} className="flex items-center gap-5">
                {i > 0 && <span className="w-1 h-1 rounded-full bg-[#6FF2C1]/40 inline-block" />}
                <span className="text-[#6FF2C1] text-[11px] font-bold tracking-[0.13em] uppercase">
                  {label}
                </span>
              </span>
            ))}
          </div>
          <h1
            className="text-white font-black leading-[1.0] tracking-[-0.04em] mb-7"
            style={{ fontSize: 'clamp(44px, 7vw, 80px)', maxWidth: 680 }}
          >
            AI That Actually
            <br />
            <span className="text-[#6FF2C1]">Moves the Numbers.</span>
          </h1>
          <p
            className="text-white/55 leading-relaxed font-normal mb-12"
            style={{ fontSize: 'clamp(16px, 1.8vw, 19px)', maxWidth: 480 }}
          >
            Most companies experiment with AI. Dave helps founders and leadership teams deploy it — with real workflows, real results, and no fluff.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/#contact"
              className="inline-block bg-[#6FF2C1] text-[#04102D] px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:bg-[#5de8b3] transition-colors"
            >
              Work with Dave
            </Link>
            <Link
              href="/speaker-topics"
              className="inline-block border border-white/25 text-white px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:border-white/50 hover:bg-white/5 transition-all"
            >
              Book a Keynote
            </Link>
          </div>
        </div>
      </section>

      {/* ── Intro Band ───────────────────────────────────────── */}
      <div className="bg-white border-b border-[#04102D]/[0.06]">
        <div className="max-w-[1080px] mx-auto px-8 sm:px-5 py-8 text-center">
          <p className="text-[#04102D]/70 text-[16px] leading-relaxed">
            Problem first. AI second. ROI always.{' '}
            <strong className="text-[#04102D]">
              Dave has built businesses across 15+ countries and now helps other founders do the same with AI as a force multiplier.
            </strong>
          </p>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────── */}
      <section className="bg-white py-16 border-b border-[#04102D]/[0.06]">
        <div className="max-w-[1080px] mx-auto px-8 sm:px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-black text-[#04102D] leading-none mb-3 tracking-tight"
                  style={{ fontSize: 'clamp(32px, 4vw, 44px)' }}>
                  {stat.value}
                </div>
                <p className="text-[12px] text-[#04102D]/40 leading-snug font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services Grid ────────────────────────────────────── */}
      <section className="bg-[#F7F9FC] py-24 md:py-32">
        <div className="max-w-[1080px] mx-auto px-8 sm:px-5">
          <div className="mb-16">
            <div className="text-[#287BE8] text-[11px] font-bold tracking-[0.13em] uppercase mb-4">
              What Dave Works On
            </div>
            <h2
              className="text-[#04102D] font-black tracking-tight leading-[1.1]"
              style={{ fontSize: 'clamp(28px, 3.5vw, 42px)' }}
            >
              Six areas where AI
              <br />
              <span className="text-[#287BE8]">creates real leverage.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.title}
                className="bg-white rounded-xl p-10 flex flex-col border border-[#04102D]/[0.06]"
              >
                <div
                  className="w-8 h-1 rounded-full mb-6"
                  style={{ background: service.accent }}
                />
                <h3 className="text-[#04102D] text-[17px] font-extrabold leading-[1.3] tracking-tight mb-4">
                  {service.title}
                </h3>
                <p className="text-[#04102D]/50 text-[14px] leading-[1.7] flex-1">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section className="bg-white py-24 md:py-32">
        <div className="max-w-[1080px] mx-auto px-8 sm:px-5">
          <div className="mb-16">
            <div className="text-[#287BE8] text-[11px] font-bold tracking-[0.13em] uppercase mb-4">
              How Dave Works
            </div>
            <h2
              className="text-[#04102D] font-black tracking-tight leading-[1.1]"
              style={{ fontSize: 'clamp(28px, 3.5vw, 42px)' }}
            >
              Three steps.
              <br />
              <span className="text-[#287BE8]">Real results.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Diagnose',
                body: "Map your current workflows and find the 20% that consume 80% of your team's time. That's where AI creates immediate leverage.",
              },
              {
                step: '02',
                title: 'Deploy',
                body: 'Build and implement AI solutions that fit your actual business — not generic templates. Real tools, real integrations, real results.',
              },
              {
                step: '03',
                title: 'Scale',
                body: 'Train your team, document the systems, and build the internal capability to keep compounding. AI advantage is a flywheel, not a one-time win.',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6">
                <div
                  className="font-black text-[#287BE8]/20 leading-none flex-shrink-0"
                  style={{ fontSize: 'clamp(36px, 4vw, 48px)' }}
                >
                  {item.step}
                </div>
                <div className="pt-2">
                  <h3 className="font-extrabold text-[#04102D] text-[17px] mb-3 tracking-tight">{item.title}</h3>
                  <p className="text-[#04102D]/50 text-[14px] leading-[1.7]">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="bg-[#04102D] py-24 md:py-32 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(40,123,232,0.12) 0%, transparent 65%)',
          }}
        />
        <div className="relative z-10 max-w-[640px] mx-auto px-8 sm:px-5 text-center">
          <div className="text-[#6FF2C1] text-[11px] font-bold tracking-[0.13em] uppercase mb-5">
            Let's Talk
          </div>
          <h2
            className="text-white font-black tracking-tight leading-[1.05] mb-6"
            style={{ fontSize: 'clamp(32px, 4.5vw, 52px)' }}
          >
            Ready to put AI
            <br />
            <span className="text-[#6FF2C1]">to work?</span>
          </h2>
          <p className="text-white/50 text-[17px] leading-relaxed mb-12 max-w-[460px] mx-auto">
            Book a call and walk away with a clear view of where AI creates the most leverage for your specific situation.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/#contact"
              className="inline-block bg-[#6FF2C1] text-[#04102D] px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:bg-[#5de8b3] transition-colors"
            >
              Book a Call
            </Link>
            <Link
              href="/blog"
              className="inline-block border border-white/25 text-white px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:border-white/50 hover:bg-white/5 transition-all"
            >
              Read the Blog
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
