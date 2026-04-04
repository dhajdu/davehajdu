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
    accent: '#D1458B',
  },
  {
    title: 'Leadership & Growth',
    description:
      'Equip business leaders with the tools, mindset, and frameworks to lead AI adoption — not just adopt AI tools. The goal is a team that thinks in systems.',
    accent: '#287BE8',
  },
  {
    title: 'Goal Setting & Performance',
    description:
      'Adopt proven goal-setting strategies that pair human ambition with AI execution. Track, iterate, and compound results faster than ever before.',
    accent: '#6FF2C1',
  },
  {
    title: 'Technology Integration',
    description:
      'Maximize efficiency by integrating the right technology stack for your business stage. No bloat, no shiny-object chasing — just tools that compound your output.',
    accent: '#D1458B',
  },
];

const stats = [
  { value: '25+', label: 'Years in business & technology' },
  { value: '3', label: 'Companies founded' },
  { value: '15+', label: 'Countries worked in' },
  { value: '500+', label: 'Leaders trained in AI' },
];

export default function AIInBusinessPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative bg-[#04102D] overflow-hidden min-h-[360px] flex items-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#04102D] via-[#04102D]/85 to-[#04102D]/50 z-10" />
          <Image
            src="/images/dave-panel.jpeg"
            alt="Dave Hajdu AI workshop panel"
            fill
            className="object-cover object-center opacity-55"
            priority
          />
        </div>
        <div className="relative z-20 max-w-[1100px] mx-auto px-8 max-md:px-5 py-16 md:py-20">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#6FF2C1] mb-4 flex items-center gap-2">
            <span className="inline-block w-8 h-px bg-[#6FF2C1]" />
            Dave Hajdu · AI in Business
          </p>
          <h1 className="text-[40px] md:text-[54px] font-black text-white leading-[1.05] mb-5 max-w-[620px]">
            AI That Actually{' '}
            <span className="text-[#6FF2C1]">Moves the Numbers</span>
          </h1>
          <p className="text-[16px] text-white/70 max-w-[480px] leading-relaxed mb-8">
            Most companies experiment with AI. Dave helps founders and leadership teams deploy it — with real workflows, real results, and no fluff.
          </p>
          <Link
            href="/#contact"
            className="inline-block bg-[#287BE8] text-white text-[13px] font-bold px-7 py-3 rounded-lg hover:bg-[#1a6ad4] transition-colors"
          >
            Work with Dave →
          </Link>
        </div>
      </section>

      {/* ── Intro Band ───────────────────────────────────────── */}
      <div className="bg-[#F8F9FC] border-y border-[#D4D9E0]">
        <div className="max-w-[800px] mx-auto px-8 max-md:px-5 py-8 text-center text-[15px] text-[#2A3044] leading-relaxed">
          Problem first. AI second. ROI always.{' '}
          <strong className="text-[#04102D]">
            Dave has built businesses across 15+ countries and now helps other founders do the same with AI as a force multiplier.
          </strong>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────── */}
      <section className="py-14 border-b border-[#D4D9E0]">
        <div className="max-w-[1100px] mx-auto px-8 max-md:px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-[40px] font-black text-[#04102D] leading-none mb-2">
                  {stat.value}
                </div>
                <p className="text-[13px] text-[#6B7280] leading-snug">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services Grid ────────────────────────────────────── */}
      <section className="py-14">
        <div className="max-w-[1100px] mx-auto px-8 max-md:px-5">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#287BE8] mb-3">
            What Dave Works On
          </p>
          <h2 className="text-[30px] md:text-[36px] font-black text-[#04102D] mb-10 max-w-[520px] leading-snug">
            Six Areas Where AI Creates Real Leverage
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.title}
                className="border border-[#D4D9E0] rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-1" style={{ background: service.accent }} />
                <div className="p-6">
                  <h3 className="font-bold text-[#04102D] text-[15px] mb-2">{service.title}</h3>
                  <p className="text-[13px] text-[#6B7280] leading-relaxed">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section className="bg-[#F8F9FC] border-y border-[#D4D9E0] py-14">
        <div className="max-w-[1100px] mx-auto px-8 max-md:px-5">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#287BE8] mb-3">
            How Dave Works
          </p>
          <h2 className="text-[28px] font-black text-[#04102D] mb-10">The Framework</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Diagnose',
                body: 'Map your current workflows and find the 20% that consume 80% of your team\'s time. That\'s where AI creates immediate leverage.',
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
              <div key={item.step} className="flex gap-5">
                <div className="text-[32px] font-black text-[#287BE8]/20 leading-none flex-shrink-0 w-10">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-[#04102D] text-[16px] mb-2">{item.title}</h3>
                  <p className="text-[13px] text-[#6B7280] leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="bg-[#04102D] py-14">
        <div className="max-w-[640px] mx-auto px-8 max-md:px-5 text-center">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#6FF2C1] mb-3">
            Let's Talk
          </p>
          <h2 className="text-[28px] font-black text-white mb-4 leading-snug">
            Ready to put AI to work in your business?
          </h2>
          <p className="text-white/60 text-[14px] mb-8 leading-relaxed">
            Book a call and walk away with a clear view of where AI creates the most leverage for your specific situation.
          </p>
          <Link
            href="/#contact"
            className="inline-block bg-[#287BE8] text-white text-[13px] font-bold px-8 py-3 rounded-lg hover:bg-[#1a6ad4] transition-colors mr-4"
          >
            Book a Call →
          </Link>
          <Link
            href="/blog"
            className="inline-block border border-white/30 text-white text-[13px] font-semibold px-8 py-3 rounded-lg hover:border-white/60 transition-colors"
          >
            Read the Blog
          </Link>
        </div>
      </section>
    </>
  );
}
