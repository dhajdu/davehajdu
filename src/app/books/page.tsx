import Link from 'next/link';

const books = [
  {
    tag: 'Strategy',
    title: 'The Four Offices of the Future',
    subtitle: 'A Diagnostic Lens for Mapping AI to Outcomes',
    description:
      '95% of companies see no ROI from AI. Not because the technology doesn\'t work. Because organizations can\'t connect it to outcomes. The Four Offices of the Future is a diagnostic framework that maps every business outcome to one of four offices: Revenue, Talent, Operations, and Innovation. It shows leaders exactly where AI should be creating value, why it currently isn\'t, and what to do about it.',
    themes: ['AI Strategy', 'Organizational Design', 'ROI Frameworks', 'Leadership'],
    color: '#287BE8',
    accent: '#6FF2C1',
    available: 'Summer 2026',
  },
  {
    tag: 'Leadership',
    title: 'The Other 50%',
    subtitle: 'Leadership Has Changed. 50% is Human. 50% is AI.',
    description:
      'The leaders who win the next decade aren\'t the ones who adopt AI fastest — they\'re the ones who learn to lead with it. The Other 50% reframes what leadership means when half the work is done by machines. It\'s a book about identity, judgment, and the rare combination of human and technical fluency that organizations desperately need right now.',
    themes: ['Leadership', 'AI Culture', 'Executive Mindset', 'The Future of Work'],
    color: '#04102D',
    accent: '#287BE8',
    available: 'Summer 2026',
  },
];

export default function BooksPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative bg-[#04102D] overflow-hidden min-h-[520px] flex items-center">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 20% 55%, rgba(40,123,232,0.14) 0%, transparent 65%)',
          }}
        />
        {/* Ghost typography */}
        <div
          aria-hidden="true"
          className="absolute right-[-40px] bottom-[-60px] font-black leading-none select-none pointer-events-none text-white/[0.025]"
          style={{ fontSize: 'clamp(200px, 28vw, 400px)', letterSpacing: '-0.06em' }}
        >
          50
        </div>

        <div className="relative z-10 max-w-[1080px] mx-auto px-8 sm:px-10 pt-32 pb-24 w-full">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-8">
            {['Author', 'AI Keynote Speaker', 'Consultant'].map((label, i) => (
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
            The Frameworks,
            <br />
            <span className="text-[#6FF2C1]">In Your Hands.</span>
          </h1>
          <p
            className="text-white/55 leading-relaxed font-normal"
            style={{ fontSize: 'clamp(16px, 1.8vw, 19px)', maxWidth: 480 }}
          >
            Two books. Both coming Summer 2026. Built from two decades at the intersection of business and AI.
          </p>
        </div>
      </section>

      {/* ── Books ────────────────────────────────────────────── */}
      <section className="bg-white py-24 md:py-32">
        <div className="max-w-[1080px] mx-auto px-8 sm:px-10">
          <div className="flex flex-col gap-12">
            {books.map((book, index) => (
              <div
                key={book.title}
                className={`grid md:grid-cols-2 gap-12 md:gap-20 items-center ${index % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}
              >
                {/* Book cover mockup */}
                <div className="flex items-center justify-center">
                  <div
                    className="relative w-full max-w-[320px] rounded-2xl overflow-hidden shadow-2xl"
                    style={{
                      aspectRatio: '3/4',
                      background: `linear-gradient(145deg, ${book.color}, ${index === 0 ? '#1a2d5a' : '#1a2b5a'})`,
                    }}
                  >
                    {/* Shimmer */}
                    <div
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)' }}
                    />
                    {/* Coming soon badge */}
                    <div className="absolute top-6 right-6">
                      <span
                        className="text-[10px] font-bold tracking-[0.12em] uppercase px-3 py-1.5 rounded-full"
                        style={{ background: 'rgba(111,242,193,0.15)', color: '#6FF2C1', border: '1px solid rgba(111,242,193,0.3)' }}
                      >
                        {book.available}
                      </span>
                    </div>
                    {/* Title on cover */}
                    <div className="absolute bottom-0 left-0 right-0 p-8"
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)' }}>
                      <p
                        className="text-white font-black leading-[1.15] tracking-tight mb-2"
                        style={{ fontSize: 'clamp(18px, 2.5vw, 24px)' }}
                      >
                        {book.title}
                      </p>
                      <p className="text-white/60 text-[12px] font-semibold">Dave Hajdu</p>
                    </div>
                  </div>
                </div>

                {/* Book details */}
                <div>
                  <span
                    className="inline-block text-[10px] font-bold tracking-[0.1em] uppercase px-3 py-1.5 rounded-full mb-5"
                    style={{ background: 'rgba(40,123,232,0.1)', color: '#287BE8' }}
                  >
                    {book.tag}
                  </span>
                  <h2
                    className="text-[#04102D] font-black tracking-tight leading-[1.1] mb-3"
                    style={{ fontSize: 'clamp(26px, 3.5vw, 40px)' }}
                  >
                    {book.title}
                  </h2>
                  <p className="text-[#287BE8] text-[14px] font-bold mb-6">{book.subtitle}</p>
                  <p className="text-[#04102D]/55 text-[16px] leading-[1.75] mb-8">
                    {book.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {book.themes.map((theme) => (
                      <span
                        key={theme}
                        className="text-[11px] font-semibold text-[#04102D]/50 border border-[#04102D]/[0.08] rounded-full px-3 py-1"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 border border-[#04102D]/[0.08] rounded-full px-5 py-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6FF2C1]" />
                      <span className="text-[#04102D]/60 text-[12px] font-semibold">{book.available}</span>
                    </div>
                    <Link
                      href="/#contact"
                      className="text-[#287BE8] text-[12px] font-bold tracking-[0.07em] uppercase flex items-center gap-2 hover:text-[#04102D] transition-colors"
                    >
                      Get notified when it drops →
                    </Link>
                  </div>
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
            While You Wait
          </div>
          <h2
            className="text-white font-black tracking-tight leading-[1.05] mb-6"
            style={{ fontSize: 'clamp(32px, 4.5vw, 52px)' }}
          >
            The frameworks are already
            <br />
            <span className="text-[#6FF2C1]">in motion.</span>
          </h2>
          <p className="text-white/50 text-[17px] leading-relaxed mb-12 max-w-[460px] mx-auto">
            Don't wait for the books. Work with Dave directly, or hear the frameworks live at your next event.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/#contact" className="inline-block bg-[#6FF2C1] text-[#04102D] px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:bg-[#5de8b3] transition-colors">
              Work with Dave
            </Link>
            <Link href="/speaker-topics" className="inline-block border border-white/25 text-white px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:border-white/50 hover:bg-white/5 transition-all">
              Book a Keynote
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
