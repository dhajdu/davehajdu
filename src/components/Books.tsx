import Link from 'next/link';

const books = [
  {
    title: 'Leadership in the AI Era',
    subtitle:
      'The definitive framework for executives navigating the AI transformation. Stop spending on tools and start building the leaders who make AI actually deliver.',
    color: '#287BE8',
    accent: '#6FF2C1',
    tag: 'Available Now',
  },
  {
    title: 'The Other 50%',
    subtitle:
      'A manifesto for the people built to stand in the gap between business and technology — the most valuable people in the room that almost nobody has trained.',
    color: '#1A2B5A',
    accent: '#287BE8',
    tag: 'Available Now',
  },
];

export default function Books() {
  return (
    <section className="bg-[#04102D] py-24 md:py-32 relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 80% 50%, rgba(40,123,232,0.08) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-[1080px] mx-auto px-8 sm:px-5">
        {/* Header */}
        <div className="mb-16">
          <div className="text-[#6FF2C1] text-[11px] font-bold tracking-[0.13em] uppercase mb-4">
            The Books
          </div>
          <h2
            className="text-white font-black tracking-tight leading-[1.1] max-w-[460px]"
            style={{ fontSize: 'clamp(28px, 3.5vw, 42px)' }}
          >
            The frameworks,
            <br />
            in your hands.
          </h2>
        </div>

        {/* Book cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {books.map((book) => (
            <div
              key={book.title}
              className="rounded-2xl p-12 flex flex-col gap-0 border border-white/[0.08] bg-white/[0.04]"
            >
              {/* Book cover mockup */}
              <div
                className="w-14 h-[72px] rounded-[4px] mb-8 relative overflow-hidden shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${book.color}, ${book.accent})`,
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)',
                  }}
                />
              </div>

              {/* Available tag */}
              <div className="flex items-center gap-2 mb-5 w-fit bg-[#6FF2C1]/10 border border-[#6FF2C1]/20 rounded-full px-3 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#6FF2C1]" />
                <span className="text-[#6FF2C1] text-[10px] font-bold tracking-[0.1em] uppercase">
                  {book.tag}
                </span>
              </div>

              <h3
                className="text-white font-black tracking-tight leading-[1.15] mb-4"
                style={{ fontSize: 'clamp(20px, 2.5vw, 28px)' }}
              >
                {book.title}
              </h3>
              <p className="text-white/50 text-[15px] leading-[1.65] flex-1 mb-9">
                {book.subtitle}
              </p>
              <Link
                href="/books"
                className="text-[#6FF2C1] text-[12px] font-bold tracking-[0.07em] uppercase flex items-center gap-2 hover:text-[#5de8b3] transition-colors"
              >
                Get the Book
                <span className="text-base">→</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
