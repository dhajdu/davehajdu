import Link from 'next/link';
import Image from 'next/image';

const topics = [
  {
    tag: 'AI Strategy',
    title: 'The Four Offices of the Future',
    description:
      '95% of companies see no ROI from AI — not because the technology doesn\'t work, but because they can\'t connect it to outcomes. This talk reframes how organizations think about AI deployment across four core business functions.',
    accent: '#287BE8',
  },
  {
    tag: 'Leadership',
    title: 'Leading AI, Not Just Using It',
    description:
      'There\'s a massive difference between using AI tools and leading AI transformation. This session teaches founders and executives the mindset shift, the frameworks, and the daily habits that separate AI leaders from AI users.',
    accent: '#6FF2C1',
  },
  {
    tag: 'Productivity',
    title: '88 Days of AI: What Daily Practice Teaches You',
    description:
      'Dave documented 88 consecutive days of AI experiments in public. This talk shares the most surprising lessons — what compounded, what failed, and what it revealed about how humans and AI actually work together.',
    accent: '#D1458B',
  },
  {
    tag: 'Business Growth',
    title: 'Problem First. AI Second. ROI Always.',
    description:
      'The most common AI mistake is starting with the tool instead of the problem. This practical framework shows how to identify your highest-leverage AI opportunities, prioritize ruthlessly, and measure what actually matters.',
    accent: '#287BE8',
  },
  {
    tag: 'Vietnam & Emerging Markets',
    title: 'Building in the World\'s Toughest Markets',
    description:
      'From Vietnam to Malaysia to the Middle East — Dave has built businesses where infrastructure, trust, and rules work differently. This talk covers the entrepreneurial lessons that only come from operating at the edge.',
    accent: '#6FF2C1',
  },
  {
    tag: 'Branding',
    title: 'Your AI Avatar Is Your Digital Twin',
    description:
      'AI avatars, digital twins, and always-on brand presence are no longer science fiction. This hands-on session shows how founders and executives can build an AI-powered personal brand that works while they sleep.',
    accent: '#D1458B',
  },
];

const eventTypes = [
  { label: 'Keynote', detail: '45–60 min' },
  { label: 'Workshop', detail: 'Half or full day' },
  { label: 'Executive Briefing', detail: 'Private session' },
  { label: 'Panel', detail: 'Moderator or speaker' },
];

export default function SpeakerTopicsPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative bg-[#04102D] overflow-hidden min-h-[380px] flex items-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#04102D] via-[#04102D]/80 to-[#04102D]/40 z-10" />
          <Image
            src="/images/dave-speaking.jpeg"
            alt="Dave Hajdu speaking"
            fill
            className="object-cover object-center opacity-55"
            priority
          />
        </div>
        <div className="relative z-20 max-w-[1100px] mx-auto px-8 max-md:px-5 py-16 md:py-24">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#6FF2C1] mb-4 flex items-center gap-2">
            <span className="inline-block w-8 h-px bg-[#6FF2C1]" />
            Dave Hajdu · Speaker
          </p>
          <h1 className="text-[40px] md:text-[54px] font-black text-white leading-[1.05] mb-5 max-w-[600px]">
            Build a Future-Ready Business{' '}
            <span className="text-[#6FF2C1]">with AI That Delivers</span>
          </h1>
          <p className="text-[16px] text-white/70 max-w-[480px] leading-relaxed mb-8">
            Proven growth frameworks, real-world case studies, and hands-on demos that audiences can implement the same week. Dave has spoken across 15+ countries to founders, executives, and leadership teams.
          </p>
          <Link
            href="/#contact"
            className="inline-block bg-[#6FF2C1] text-[#04102D] text-[13px] font-bold px-7 py-3 rounded-lg hover:bg-[#5de8b3] transition-colors"
          >
            Book Dave to Speak →
          </Link>
        </div>
      </section>

      {/* ── Social Proof Band ────────────────────────────────── */}
      <div className="bg-[#F8F9FC] border-y border-[#D4D9E0]">
        <div className="max-w-[900px] mx-auto px-8 max-md:px-5 py-8 text-center text-[15px] text-[#2A3044] leading-relaxed">
          <strong className="text-[#04102D]">95% of attendees report actionable insights they implement immediately.</strong>{' '}
          Dave speaks at conferences, leadership summits, corporate offsites, and university programs across Asia, the Middle East, and North America.
        </div>
      </div>

      {/* ── Event Types ──────────────────────────────────────── */}
      <section className="py-10 border-b border-[#D4D9E0]">
        <div className="max-w-[1100px] mx-auto px-8 max-md:px-5">
          <div className="flex flex-wrap gap-4 justify-center">
            {eventTypes.map((e) => (
              <div
                key={e.label}
                className="flex items-center gap-2 bg-white border border-[#D4D9E0] rounded-full px-5 py-2"
              >
                <span className="w-2 h-2 rounded-full bg-[#287BE8] flex-shrink-0" />
                <span className="font-semibold text-[#04102D] text-[13px]">{e.label}</span>
                <span className="text-[#6B7280] text-[12px]">· {e.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Topics ───────────────────────────────────────────── */}
      <section className="py-14">
        <div className="max-w-[1100px] mx-auto px-8 max-md:px-5">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#287BE8] mb-3">
            Speaking Topics
          </p>
          <h2 className="text-[30px] md:text-[36px] font-black text-[#04102D] mb-10 max-w-[520px] leading-snug">
            Six Talks. All Built From Real Experience.
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {topics.map((topic) => (
              <div
                key={topic.title}
                className="border border-[#D4D9E0] rounded-xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="h-1 flex-shrink-0" style={{ background: topic.accent }} />
                <div className="p-6 flex flex-col flex-1">
                  <span
                    className="inline-block text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded-full mb-3 self-start"
                    style={{ background: `${topic.accent}18`, color: topic.accent }}
                  >
                    {topic.tag}
                  </span>
                  <h3 className="font-bold text-[#04102D] text-[16px] mb-2 leading-snug">{topic.title}</h3>
                  <p className="text-[13px] text-[#6B7280] leading-relaxed flex-1">{topic.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Past Audiences ───────────────────────────────────── */}
      <section className="bg-[#F8F9FC] border-y border-[#D4D9E0] py-14">
        <div className="max-w-[1100px] mx-auto px-8 max-md:px-5">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#287BE8] mb-3">
            Who Dave Speaks To
          </p>
          <h2 className="text-[28px] font-black text-[#04102D] mb-8">Past Audiences Include</h2>
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
                className="bg-white border border-[#D4D9E0] rounded-lg px-4 py-3 text-[13px] font-medium text-[#2A3044] text-center"
              >
                {audience}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="bg-[#04102D] py-14">
        <div className="max-w-[640px] mx-auto px-8 max-md:px-5 text-center">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#6FF2C1] mb-3">
            Invite Dave to Speak
          </p>
          <h2 className="text-[28px] font-black text-white mb-4 leading-snug">
            Your audience will leave with a plan, not just inspiration.
          </h2>
          <p className="text-white/60 text-[14px] mb-8 leading-relaxed">
            Dave customizes every talk to your audience, industry, and goals. Tell him about your event and he'll tell you which topic fits best.
          </p>
          <Link
            href="/#contact"
            className="inline-block bg-[#6FF2C1] text-[#04102D] text-[13px] font-bold px-8 py-3 rounded-lg hover:bg-[#5de8b3] transition-colors"
          >
            Enquire About Booking →
          </Link>
        </div>
      </section>
    </>
  );
}
