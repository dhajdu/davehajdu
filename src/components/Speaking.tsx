import Link from 'next/link';

const services = [
  {
    icon: '◎',
    label: 'Keynotes',
    title: 'The talk that changes how your organization thinks about AI.',
    body: 'Dave brings the rare combination of executive presence and technical credibility to stages that need more than hype. Practical frameworks. Real stories. Lasting impact.',
    cta: 'Book a Keynote',
    href: '/speaker-topics',
    accentClass: 'text-[#6FF2C1]',
  },
  {
    icon: '◈',
    label: 'Consultation',
    title: 'Turn your AI investment into measurable ROI.',
    body: "Most organizations are spending on AI and getting zero return — not because the technology fails, but because their leaders were never trained to lead with it. Dave fixes that.",
    cta: 'Schedule a Consultation',
    href: '/ai-in-business',
    accentClass: 'text-[#287BE8]',
  },
  {
    icon: '◧',
    label: 'Books',
    title: 'The frameworks, in your hands.',
    body: 'Two books. The Four Offices of the Future connects outcomes to AI across every business function. The Other 50% reframes what leadership means when half of it is human and half is AI.',
    cta: 'View the Books',
    href: '/books',
    accentClass: 'text-[#6FF2C1]/70',
  },
];

export default function Speaking() {
  return (
    <section id="speaking" className="bg-[#F7F9FC] py-24 md:py-32">
      <div className="max-w-[1080px] mx-auto px-8 sm:px-5">

        {/* Section header */}
        <div className="text-center mb-16">
          <div className="text-[#287BE8] text-[11px] font-bold tracking-[0.13em] uppercase mb-4">
            How I Can Help
          </div>
          <h2
            className="text-[#04102D] font-black tracking-tight leading-[1.1]"
            style={{ fontSize: 'clamp(28px, 3.5vw, 42px)' }}
          >
            Problem first. AI second.
            <br />
            <span className="text-[#287BE8]">ROI always.</span>
          </h2>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {services.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl p-10 flex flex-col border border-[#04102D]/[0.06]"
            >
              <div className={`text-[28px] mb-5 leading-none ${s.accentClass}`}>
                {s.icon}
              </div>
              <div className="text-[#287BE8] text-[10px] font-bold tracking-[0.13em] uppercase mb-3">
                {s.label}
              </div>
              <h3 className="text-[#04102D] text-[18px] font-extrabold leading-[1.3] tracking-tight mb-4">
                {s.title}
              </h3>
              <p className="text-[#04102D]/50 text-[14px] leading-[1.7] flex-1 mb-8">
                {s.body}
              </p>
              <Link
                href={s.href}
                className="text-[#04102D] text-[12px] font-bold tracking-[0.07em] uppercase flex items-center gap-2 hover:text-[#287BE8] transition-colors"
              >
                {s.cta}
                <span className="text-base">→</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
