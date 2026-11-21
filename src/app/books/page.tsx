import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

const AMAZON_URL = 'https://www.amazon.com/dp/B0HR5JJHF4';

export const metadata: Metadata = {
  title: 'The Night the Fight Broke Out, a Leadership Fable by Dave Hajdu',
  description:
    'The Night the Fight Broke Out: a leadership fable about how a business builds the foundations to lead AI. Out now in paperback and Kindle. The Other 50% is coming Q1 2027.',
  openGraph: {
    title: 'The Night the Fight Broke Out',
    description: 'A leadership fable about how a business builds the foundations to lead AI. Stop using AI, start leading it.',
    images: ['/images/books/the-night-the-fight-broke-out.jpg'],
  },
};

const book = {
  title: 'The Night the Fight Broke Out',
  subtitle: 'A Leadership Fable About How a Business Builds the Foundations to Lead AI',
  hook: "The biggest booking in the company's history came in on a handshake.",
  story: [
    "Ron Woo runs three rooms on memory, loyalty, and twenty years of instinct. Then four unwatched minutes at the rope end with the guest of honor cut by glass, and the lawsuit that follows asks a question Ron cannot answer: can you prove you were not negligent? There is no contract, no waiver, no incident report. The only official record of the night is a group text.",
    'What follows is a twelve-month rebuild, one workflow at a time, told in thirty-five short scenes in the tradition of the great business fables.',
  ],
  skills: [
    { name: 'Workflow design', body: "Getting the work out of people's heads and onto paper, where it can be examined, taught, and defended." },
    { name: 'Information architecture', body: 'One floor where everything the company knows actually lives.' },
    { name: 'Instructions for AI', body: 'AI does exactly what the instructions say, so the instructions are now the work.' },
  ],
  forWho: 'For owners, operators, and executives who suspect their company still runs on memory.',
  details: ['Paperback $14.99', 'Kindle', '136 pages', 'November 2026'],
};

export default function BooksPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative bg-[#04102D] overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 75% 55%, rgba(209,69,139,0.12) 0%, transparent 65%)',
          }}
        />
        <div className="relative z-10 max-w-[1080px] mx-auto px-8 sm:px-10 pt-32 pb-24 w-full grid md:grid-cols-[1.15fr_0.85fr] gap-14 md:gap-20 items-center">
          <div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-8">
              {['New book', 'Out now', 'A leadership fable'].map((label, i) => (
                <span key={label} className="flex items-center gap-5">
                  {i > 0 && <span className="w-1 h-1 rounded-full bg-[#6FF2C1]/40 inline-block" />}
                  <span className="text-[#6FF2C1] text-[11px] font-bold tracking-[0.13em] uppercase">{label}</span>
                </span>
              ))}
            </div>
            <h1
              className="text-white font-black leading-[1.0] tracking-[-0.04em] mb-7"
              style={{ fontSize: 'clamp(44px, 6.5vw, 76px)' }}
            >
              Stop using AI,
              <br />
              <span className="text-[#6FF2C1]">start leading it</span>
            </h1>
            <p
              className="text-white/60 leading-relaxed font-normal mb-10"
              style={{ fontSize: 'clamp(16px, 1.8vw, 19px)', maxWidth: 500 }}
            >
              <em className="not-italic text-white font-semibold">{book.title}</em> is a leadership fable about how a business builds the foundations to lead AI. Out now in paperback and Kindle.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={AMAZON_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#6FF2C1] text-[#04102D] px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:bg-[#5de8b3] transition-colors"
              >
                Get it on Amazon
              </a>
              <a
                href="#the-book"
                className="inline-block border border-white/25 text-white px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:border-white/50 hover:bg-white/5 transition-all"
              >
                Read about it
              </a>
            </div>
          </div>
          <a href={AMAZON_URL} target="_blank" rel="noopener noreferrer" className="justify-self-center w-full max-w-[340px]">
            <Image
              src="/images/books/the-night-the-fight-broke-out.jpg"
              alt="The Night the Fight Broke Out by Dave Hajdu, book cover"
              width={776}
              height={1200}
              priority
              className="w-full h-auto rounded-[6px] shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
            />
          </a>
        </div>
      </section>

      {/* ── The book ─────────────────────────────────────────── */}
      <section id="the-book" className="bg-white py-24 md:py-32">
        <div className="max-w-[760px] mx-auto px-8 sm:px-10">
          <span
            className="inline-block text-[10px] font-bold tracking-[0.1em] uppercase px-3 py-1.5 rounded-full mb-5"
            style={{ background: 'rgba(40,123,232,0.1)', color: '#287BE8' }}
          >
            The story
          </span>
          <h2
            className="text-[#04102D] font-black tracking-tight leading-[1.1] mb-3"
            style={{ fontSize: 'clamp(28px, 3.8vw, 42px)' }}
          >
            {book.title}
          </h2>
          <p className="text-[#287BE8] text-[14px] font-bold mb-8">{book.subtitle}</p>
          <p className="text-[#04102D] text-[20px] font-semibold leading-[1.5] mb-6">{book.hook}</p>
          {book.story.map((p) => (
            <p key={p.slice(0, 20)} className="text-[#04102D]/60 text-[16px] leading-[1.75] mb-5">
              {p}
            </p>
          ))}

          <h3 className="text-[#04102D] font-black tracking-tight text-[22px] mt-12 mb-6">
            The half of the job nobody taught today&apos;s leaders
          </h3>
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {book.skills.map((s, i) => (
              <div key={s.name} className="rounded-2xl border border-[#04102D]/[0.08] p-6">
                <div className="text-[#287BE8] text-[12px] font-bold mb-2">0{i + 1}</div>
                <div className="text-[#04102D] font-bold text-[16px] mb-2">{s.name}</div>
                <p className="text-[#04102D]/55 text-[14px] leading-[1.6]">{s.body}</p>
              </div>
            ))}
          </div>
          <p className="text-[#04102D]/60 text-[16px] leading-[1.75] mb-10">
            The story ends with The Model: the three skills, the line between human and AI work, and the sequence for building it. {book.forWho}
          </p>

          <div className="flex flex-wrap items-center gap-2 mb-10">
            {book.details.map((d) => (
              <span
                key={d}
                className="text-[11px] font-semibold text-[#04102D]/50 border border-[#04102D]/[0.08] rounded-full px-3 py-1"
              >
                {d}
              </span>
            ))}
          </div>
          <a
            href={AMAZON_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#04102D] text-white px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:bg-[#287BE8] transition-colors"
          >
            Get it on Amazon →
          </a>
        </div>
      </section>

      {/* ── Coming next ──────────────────────────────────────── */}
      <section className="bg-[#EAEEF2] py-20 md:py-24">
        <div className="max-w-[760px] mx-auto px-8 sm:px-10">
          <div className="flex items-center gap-2 mb-5 w-fit bg-white border border-[#04102D]/[0.08] rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D1458B]" />
            <span className="text-[#04102D]/70 text-[10px] font-bold tracking-[0.1em] uppercase">Coming Q1 2027</span>
          </div>
          <h2
            className="text-[#04102D] font-black tracking-tight leading-[1.1] mb-3"
            style={{ fontSize: 'clamp(28px, 3.8vw, 42px)' }}
          >
            The Other 50%
          </h2>
          <p className="text-[#287BE8] text-[14px] font-bold mb-6">Leadership has changed, 50% is human and 50% is AI</p>
          <p className="text-[#04102D]/60 text-[16px] leading-[1.75] mb-8">
            The leaders who win the next decade aren&apos;t the ones who adopt AI fastest. They&apos;re the ones who learn to lead with it. The Other 50% reframes what leadership means when half the work is done by machines: identity, judgment, and the rare mix of human and technical fluency organizations need right now.
          </p>
          <Link
            href="/#contact"
            className="text-[#287BE8] text-[12px] font-bold tracking-[0.07em] uppercase inline-flex items-center gap-2 hover:text-[#04102D] transition-colors"
          >
            Get notified when it drops →
          </Link>
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
            Beyond the book
          </div>
          <h2
            className="text-white font-black tracking-tight leading-[1.05] mb-6"
            style={{ fontSize: 'clamp(32px, 4.5vw, 52px)' }}
          >
            Build the foundations
            <br />
            <span className="text-[#6FF2C1]">in your company</span>
          </h2>
          <p className="text-white/50 text-[17px] leading-relaxed mb-12 max-w-[460px] mx-auto">
            Work with Dave directly, or hear the framework live at your next event.
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
