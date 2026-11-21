import Image from 'next/image';
import Link from 'next/link';

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

      <div className="relative z-10 max-w-[1080px] mx-auto px-8 sm:px-10">
        <div className="grid md:grid-cols-[0.7fr_1.3fr] gap-12 md:gap-20 items-center">
          <Link href="/books" className="justify-self-center w-full max-w-[280px]">
            <Image
              src="/images/books/the-night-the-fight-broke-out.jpg"
              alt="The Night the Fight Broke Out by Dave Hajdu, book cover"
              width={776}
              height={1200}
              className="w-full h-auto rounded-[6px] shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
            />
          </Link>

          <div>
            <div className="text-[#6FF2C1] text-[11px] font-bold tracking-[0.13em] uppercase mb-4">
              The Book
            </div>
            <div className="flex items-center gap-2 mb-5 w-fit bg-[#6FF2C1]/10 border border-[#6FF2C1]/20 rounded-full px-3 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#6FF2C1]" />
              <span className="text-[#6FF2C1] text-[10px] font-bold tracking-[0.1em] uppercase">Out Now</span>
            </div>
            <h2
              className="text-white font-black tracking-tight leading-[1.1] mb-5"
              style={{ fontSize: 'clamp(28px, 3.5vw, 42px)' }}
            >
              The Night the Fight Broke Out
            </h2>
            <p className="text-white/50 text-[16px] leading-[1.7] mb-9 max-w-[520px]">
              A leadership fable about how a business builds the foundations to lead AI. One bad night at a
              restaurant group, a lawsuit nobody can answer, and a twelve-month rebuild, one workflow at a time.
            </p>
            <Link
              href="/books"
              className="text-[#6FF2C1] text-[12px] font-bold tracking-[0.07em] uppercase flex items-center gap-2 hover:text-[#5de8b3] transition-colors"
            >
              Get the Book
              <span className="text-base">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
