import Link from 'next/link';
import Image from 'next/image';

const topics = [
  {
    tag: 'AI Strategy',
    title: 'The Four Offices of the Future',
    description:
      '95% of companies see no ROI from AI, not because the technology doesn\'t work, but because they can\'t connect it to outcomes. This talk reframes how organizations think about AI deployment across four core business functions.',
    accent: '#287BE8',
  },
];

const eventTypes = [
  { label: '2 Hour Session', detail: 'Keynote + Q&A' },
  { label: '4 Hour Session', detail: 'Keynote + workshop' },
  { label: 'All Day Session', detail: 'Deep-dive immersion' },
];

export default function SpeakerTopicsPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative bg-[#04102D] overflow-hidden min-h-[520px] flex items-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#04102D] via-[#04102D]/80 to-[#04102D]/30 z-10" />
          <Image
            src="/images/dave-speaking.webp"
            alt="Dave Hajdu speaking"
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

        <div className="relative z-20 max-w-[1080px] mx-auto px-8 sm:px-10 pt-32 pb-24 w-full">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-8">
            {['AI Keynote Speaker', 'Workshops', 'Executive Briefings'].map((label, i) => (
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
            Talks That
            <br />
            <span className="text-[#6FF2C1]">Move People.</span>
          </h1>
          <p
            className="text-white/55 leading-relaxed font-normal mb-12"
            style={{ fontSize: 'clamp(16px, 1.8vw, 19px)', maxWidth: 480 }}
          >
            Proven frameworks, real-world stories, and hands-on demos that audiences can implement the same week. Dave has spoken across 15+ countries to founders, executives, and leadership teams.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/#contact"
              className="inline-block bg-[#6FF2C1] text-[#04102D] px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:bg-[#5de8b3] transition-colors"
            >
              Book Dave to Speak
            </Link>
            <Link
              href="/#contact"
              className="inline-block border border-white/25 text-white px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:border-white/50 hover:bg-white/5 transition-all"
            >
              Schedule a Consultation
            </Link>
          </div>
        </div>
      </section>

      {/* ── Social Proof Band ────────────────────────────────── */}
      <div className="bg-white border-b border-[#04102D]/[0.06]">
        <div className="max-w-[1080px] mx-auto px-8 sm:px-10 py-8 text-center">
          <p className="text-[#04102D]/70 text-[16px] leading-relaxed">
            <strong className="text-[#04102D]">95% of attendees report actionable insights they implement immediately.</strong>{' '}
            Dave speaks at conferences, leadership summits, corporate offsites, and university programs across Asia, the Middle East, and North America.
          </p>
        </div>
      </div>

      {/* ── Event Types ──────────────────────────────────────── */}
      <section className="bg-white py-14">
        <div className="max-w-[1080px] mx-auto px-8 sm:px-10">
          <div className="flex flex-wrap gap-3 justify-center">
            {eventTypes.map((e) => (
              <div
                key={e.label}
                className="flex items-center gap-2 border border-[#04102D]/[0.08] rounded-full px-6 py-2.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#6FF2C1] flex-shrink-0" />
                <span className="font-bold text-[#04102D] text-[13px]">{e.label}</span>
                <span className="text-[#04102D]/40 text-[12px]">· {e.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Topics ───────────────────────────────────────────── */}
      <section className="bg-[#F7F9FC] py-24 md:py-32">
        <div className="max-w-[1080px] mx-auto px-8 sm:px-10">
          <div className="mb-16">
            <div className="text-[#287BE8] text-[11px] font-bold tracking-[0.13em] uppercase mb-4">
              Signature Keynote
            </div>
            <h2
              className="text-[#04102D] font-black tracking-tight leading-[1.1]"
              style={{ fontSize: 'clamp(28px, 3.5vw, 42px)' }}
            >
              One signature talk.
              <br />
              <span className="text-[#287BE8]">Built from real experience.</span>
            </h2>
          </div>

          <div className="grid gap-6 max-w-[720px] mx-auto">
            {topics.map((topic) => (
              <div
                key={topic.title}
                className="bg-white rounded-xl p-10 flex flex-col border border-[#04102D]/[0.06]"
              >
                <span
                  className="inline-block text-[10px] font-bold tracking-[0.1em] uppercase px-3 py-1.5 rounded-full mb-5 self-start"
                  style={{
                    background: topic.accent === '#6FF2C1' ? 'rgba(111,242,193,0.15)' : 'rgba(40,123,232,0.1)',
                    color: topic.accent === '#6FF2C1' ? '#1A9E74' : '#287BE8',
                  }}
                >
                  {topic.tag}
                </span>
                <h3 className="text-[#04102D] text-[18px] font-extrabold leading-[1.3] tracking-tight mb-4 flex-1">
                  {topic.title}
                </h3>
                <p className="text-[#04102D]/50 text-[14px] leading-[1.7]">
                  {topic.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Past Audiences ───────────────────────────────────── */}
      <section className="bg-white py-24 md:py-32">
        <div className="max-w-[1080px] mx-auto px-8 sm:px-10">
          <div className="mb-16">
            <div className="text-[#287BE8] text-[11px] font-bold tracking-[0.13em] uppercase mb-4">
              Who Dave Speaks To
            </div>
            <h2
              className="text-[#04102D] font-black tracking-tight leading-[1.1]"
              style={{ fontSize: 'clamp(28px, 3.5vw, 42px)' }}
            >
              Built for the rooms
              <br />
              <span className="text-[#287BE8]">where decisions get made.</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Founders & CEOs',
              'Executive Leadership Teams',
              'EO & YPO Chapters',
              'University Programs',
              'Corporate Offsites',
              'Industry Conferences',
              'AI & Tech Summits',
              'Hospitality & Tourism Groups',
            ].map((audience) => (
              <div
                key={audience}
                className="border border-[#04102D]/[0.06] rounded-xl px-5 py-4 text-[13px] font-semibold text-[#04102D]/70 text-center"
              >
                {audience}
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
        <div className="relative z-10 max-w-[640px] mx-auto px-8 sm:px-10 text-center">
          <div className="text-[#6FF2C1] text-[11px] font-bold tracking-[0.13em] uppercase mb-5">
            Invite Dave to Speak
          </div>
          <h2
            className="text-white font-black tracking-tight leading-[1.05] mb-6"
            style={{ fontSize: 'clamp(32px, 4.5vw, 52px)' }}
          >
            Your audience will leave
            <br />
            <span className="text-[#6FF2C1]">with a plan.</span>
          </h2>
          <p className="text-white/50 text-[17px] leading-relaxed mb-12 max-w-[460px] mx-auto">
            Dave customizes every talk to your audience, industry, and goals. Tell him about your event and he'll tell you which topic fits best.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/#contact"
              className="inline-block bg-[#6FF2C1] text-[#04102D] px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:bg-[#5de8b3] transition-colors"
            >
              Enquire About Booking
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
    </>
  );
}
