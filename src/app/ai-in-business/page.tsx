import Link from 'next/link';
import Image from 'next/image';

const offices = [
  {
    tag: 'Revenue',
    title: 'Connect AI to the customer outcomes that drive growth.',
    body: 'Everything that brings in new business and keeps it. But it only works when someone owns the whole pipeline. Not just marketing, not just sales, the whole thing. When it\'s siloed, AI optimizes pieces that don\'t connect.',
    aiUse: 'Sales pipeline optimization, customer journey automation, retention systems',
    accent: '#287BE8',
  },
  {
    tag: 'Talent',
    title: 'Treat your people processes as a product, not a process.',
    body: 'The full lifecycle of your people: hiring, onboarding, development, culture. Most organizations discover their entire onboarding process lives in one person\'s head. If that person leaves, the process leaves with them.',
    aiUse: 'Talent matching, onboarding automation, performance development',
    accent: '#6FF2C1',
  },
  {
    tag: 'Operations',
    title: 'Redesign workflows before you automate them.',
    body: 'Everything that keeps the business running. The trap: if you automate chaos, you get faster chaos. Operations AI only works when you redesign workflows first, not patch the ones that were already broken.',
    aiUse: 'Workflow automation, process documentation, decision routing',
    accent: '#287BE8',
  },
  {
    tag: 'Innovation',
    title: 'Give your teams the space and tools to build what\'s next.',
    body: 'The lens on the future of your business. Innovation doesn\'t die from lack of ideas. It dies from lack of bandwidth. AI gives your best thinkers time back to use it.',
    aiUse: 'Rapid prototyping, market intelligence, scenario planning',
    accent: '#6FF2C1',
  },
];

const auditDimensions = [
  {
    label: 'Data',
    description: 'Where your client and business data sits, how it flows, and what AI can actually access. Most organizations discover their data is more scattered than they realized.',
  },
  {
    label: 'Workflows',
    description: 'Which processes are ready for AI and which change too often to automate. Not every workflow should be automated. We identify which ones should be built to last.',
  },
  {
    label: 'Tools',
    description: 'What you run, what is redundant, and where vendor lock-in creates risk. Many organizations are paying for tools that conflict with each other.',
  },
  {
    label: 'People',
    description: 'Where your team is stretched and who is doing work below their skill level. This is where AI creates the fastest ROI, freeing your best people to do their best work.',
  },
];

const auditDeliverables = [
  {
    title: 'AI Maturity Scorecard',
    description: 'Readiness across all four dimensions with risk scores specific to your industry and context.',
  },
  {
    title: '12-Month Opportunity Plan',
    description: 'Where AI delivers ROI, prioritized by impact, feasibility, and process volatility.',
  },
  {
    title: 'Workflow Documentation',
    description: 'Processes ready for AI, mapped so you can act. Volatility scored so you avoid building what will break.',
  },
];

const stats = [
  { value: '$9.5M', label: 'Raised, led by Baseline Ventures' },
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
            src="/images/dave-panel.webp"
            alt="Dave Hajdu AI workshop panel"
            fill
            className="object-cover object-center opacity-55"
            priority
          />
        </div>
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 70% at 15% 55%, rgba(40,123,232,0.12) 0%, transparent 65%)',
          }}
        />
        <div className="relative z-20 max-w-[1080px] mx-auto px-8 sm:px-10 pt-32 pb-24 w-full">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-8">
            {['AI Consultant', 'Strategist', 'Operator'].map((label, i) => (
              <span key={i} className="flex items-center gap-5">
                {i > 0 && <span className="w-1 h-1 rounded-full bg-[#6FF2C1]/40 inline-block" />}
                <span className="text-[#6FF2C1] text-[11px] font-bold tracking-[0.13em] uppercase">{label}</span>
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
            Most companies experiment with AI. Dave helps founders and leadership teams deploy it, with real workflows, real results, and no fluff.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/#contact" className="inline-block bg-[#6FF2C1] text-[#04102D] px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:bg-[#5de8b3] transition-colors">
              Work with Dave
            </Link>
            <Link href="/speaker-topics" className="inline-block border border-white/25 text-white px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:border-white/50 hover:bg-white/5 transition-all">
              Book a Keynote
            </Link>
          </div>
        </div>
      </section>

      {/* ── Intro Band ───────────────────────────────────────── */}
      <div className="bg-white border-b border-[#04102D]/[0.06]">
        <div className="max-w-[1080px] mx-auto px-8 sm:px-10 py-8 text-center">
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
        <div className="max-w-[1080px] mx-auto px-8 sm:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-black text-[#04102D] leading-none mb-3 tracking-tight" style={{ fontSize: 'clamp(32px, 4vw, 44px)' }}>
                  {stat.value}
                </div>
                <p className="text-[12px] text-[#04102D]/40 leading-snug font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Four Offices ─────────────────────────────────────── */}
      <section className="bg-[#F7F9FC] py-24 md:py-32">
        <div className="max-w-[1080px] mx-auto px-8 sm:px-10">
          <div className="mb-16">
            <div className="text-[#287BE8] text-[11px] font-bold tracking-[0.13em] uppercase mb-4">
              The Four Offices of the Future
            </div>
            <h2
              className="text-[#04102D] font-black tracking-tight leading-[1.1] mb-5"
              style={{ fontSize: 'clamp(28px, 3.5vw, 42px)' }}
            >
              A diagnostic lens for mapping
              <br />
              <span className="text-[#287BE8]">AI to outcomes.</span>
            </h2>
            <p className="text-[#04102D]/50 text-[17px] leading-[1.7] max-w-[560px]">
              Every outcome your business cares about maps to one of four offices. This isn't a new org chart. It's a diagnostic. A way to look at your business and ask: where should AI be creating value, and why isn't it?
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {offices.map((office) => (
              <div key={office.tag} className="bg-white rounded-xl p-10 flex flex-col border border-[#04102D]/[0.06]">
                <span
                  className="inline-block text-[10px] font-bold tracking-[0.1em] uppercase px-3 py-1.5 rounded-full mb-5 self-start"
                  style={{
                    background: office.accent === '#6FF2C1' ? 'rgba(111,242,193,0.15)' : 'rgba(40,123,232,0.1)',
                    color: office.accent === '#6FF2C1' ? '#1A9E74' : '#287BE8',
                  }}
                >
                  {office.tag}
                </span>
                <h3 className="text-[#04102D] text-[18px] font-extrabold leading-[1.3] tracking-tight mb-4">
                  {office.title}
                </h3>
                <p className="text-[#04102D]/50 text-[14px] leading-[1.7] flex-1 mb-5">
                  {office.body}
                </p>
                <div className="border-t border-[#04102D]/[0.06] pt-4">
                  <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#287BE8]/70 mb-1">AI Use</p>
                  <p className="text-[#04102D]/40 text-[13px]">{office.aiUse}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Capabilities Audit ────────────────────────────── */}
      <section className="bg-white py-24 md:py-32">
        <div className="max-w-[1080px] mx-auto px-8 sm:px-10">
          <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-start">

            {/* Left: Intro */}
            <div>
              <div className="text-[#287BE8] text-[11px] font-bold tracking-[0.13em] uppercase mb-4">
                AI Risk & Capabilities Audit
              </div>
              <h2
                className="text-[#04102D] font-black tracking-tight leading-[1.1] mb-6"
                style={{ fontSize: 'clamp(26px, 3vw, 38px)' }}
              >
                Before you build anything,
                <br />
                <span className="text-[#287BE8]">know where you actually stand.</span>
              </h2>
              <p className="text-[#04102D]/55 text-[16px] leading-[1.75] mb-5">
                Most organizations come to me after they've already spent money on AI and gotten nothing back. The problem is almost never the tools. It's that nobody scored the risk before they started building.
              </p>
              <p className="text-[#04102D]/55 text-[16px] leading-[1.75] mb-8">
                As your CAIO, I run a structured audit across four dimensions: stakeholder interviews, team surveys, and process mapping, then score your readiness and risk before recommending a single dollar of spend.
              </p>

              {/* Audit dimensions */}
              <div className="flex flex-col gap-4">
                {auditDimensions.map((dim) => (
                  <div key={dim.label} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-20 pt-0.5">
                      <span className="text-[11px] font-black tracking-[0.1em] uppercase text-[#287BE8]">{dim.label}</span>
                    </div>
                    <p className="text-[#04102D]/50 text-[14px] leading-[1.65]">{dim.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Deliverables + CTA */}
            <div>
              {/* Deliverables card */}
              <div className="bg-[#04102D] rounded-2xl p-10 mb-6">
                <div className="text-[#6FF2C1] text-[11px] font-bold tracking-[0.13em] uppercase mb-6">
                  What You Receive
                </div>
                <div className="flex flex-col gap-6">
                  {auditDeliverables.map((d, i) => (
                    <div key={d.title} className="flex gap-4 items-start">
                      <div
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black mt-0.5"
                        style={{ background: 'rgba(111,242,193,0.15)', color: '#6FF2C1' }}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-white text-[14px] font-bold mb-1">{d.title}</p>
                        <p className="text-white/45 text-[13px] leading-[1.6]">{d.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk note */}
              <div className="border border-[#04102D]/[0.06] rounded-xl p-8 mb-6">
                <p className="text-[#04102D] text-[14px] font-bold mb-2">Risk is scored before anything is recommended.</p>
                <p className="text-[#04102D]/50 text-[13px] leading-[1.65]">
                  Regulatory compliance, data confidentiality, process volatility, vendor lock-in, and change readiness. Every recommendation is filtered through your specific risk profile, not a generic template.
                </p>
              </div>

              <Link
                href="/#contact"
                className="inline-block w-full text-center bg-[#287BE8] text-white px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:bg-[#1a6ad4] transition-colors"
              >
                Request an Audit
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section className="bg-[#F7F9FC] py-24 md:py-32">
        <div className="max-w-[1080px] mx-auto px-8 sm:px-10">
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
                body: 'Build and implement AI solutions that fit your actual business, not generic templates. Real tools, real integrations, real results.',
              },
              {
                step: '03',
                title: 'Scale',
                body: 'Train your team, document the systems, and build the internal capability to keep compounding. AI advantage is a flywheel, not a one-time win.',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6">
                <div className="font-black text-[#287BE8]/20 leading-none flex-shrink-0" style={{ fontSize: 'clamp(36px, 4vw, 48px)' }}>
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
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(40,123,232,0.12) 0%, transparent 65%)' }}
        />
        <div className="relative z-10 max-w-[640px] mx-auto px-8 sm:px-10 text-center">
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
            <Link href="/#contact" className="inline-block bg-[#6FF2C1] text-[#04102D] px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:bg-[#5de8b3] transition-colors">
              Book a Call
            </Link>
            <Link href="/blog" className="inline-block border border-white/25 text-white px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:border-white/50 hover:bg-white/5 transition-all">
              Read the Blog
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
