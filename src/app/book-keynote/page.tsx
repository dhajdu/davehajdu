/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next';
import InquiryForm, { type InquiryField } from '@/components/InquiryForm';
import WorkshopClip, { type Clip } from '@/components/WorkshopClip';

export const metadata: Metadata = {
  title: 'Book an AI Workshop with Dave Hajdu for Your Organization',
  description:
    'For EO and YPO learning chairs and leadership teams. Half a day to two days at your venue, and every member goes home with a live system on their own business. 1,028 attendees, 14 events, NPS 79.',
};

const SCHEDULER_URL = 'https://edge8company.sg.larksuite.com/scheduler/d110260f235911c8';
const IL = 'https://infiniteleverage-8.com';

// Snapshot of the Infinite Leverage track record (company_os.events plus the
// pooled feedback survey), as shown on infiniteleverage-8.com/retreats on 2026-11-01.
const PROOF = [
  { stat: '1,028', label: 'Attendees so far' },
  { stat: '14', label: 'Events so far' },
  { stat: '79', label: 'NPS across events' },
  { stat: '4.4/5', label: 'More confident leading AI' },
];

// Members on camera, picked to differ from the Infinite Leverage retreats page.
const CLIPS: Clip[] = [
  {
    id: 'goro',
    src: 'https://h126e1av9m6qb7an.public.blob.vercel-storage.com/video/founder-goro.mp4',
    poster: '/images/workshops/goro.webp',
    name: 'Goro Gupta',
    role: 'Founder, Ethical Property Investments',
    room: 'EO Melbourne',
    quote: "You're actually doing the AI stuff",
    posterHasText: true,
  },
  {
    id: 'ashton',
    src: 'https://h126e1av9m6qb7an.public.blob.vercel-storage.com/video/founder-ashton.mp4',
    poster: '/images/workshops/ashton.webp',
    name: 'Ashton Bishop',
    role: 'Founder, Step Change',
    room: 'EO Melbourne',
    quote: 'An agent in the cloud which pulls together a daily dashboard',
    posterHasText: true,
  },
  {
    id: 'peter',
    src: 'https://h126e1av9m6qb7an.public.blob.vercel-storage.com/video/founder-peter.mp4',
    poster: '/images/workshops/peter.webp',
    name: 'Peter Ling',
    role: 'Founder, Crystal Palace Catering',
    room: 'EO Melbourne',
    quote: "I'm now sort of weaponized with some tools",
    posterHasText: true,
  },
  {
    id: 'sue',
    src: 'https://h126e1av9m6qb7an.public.blob.vercel-storage.com/video/founder-sue.mp4',
    poster: '/images/workshops/sue.webp',
    name: 'Sue Cook',
    role: 'Founder, Aged Care & Medical',
    room: 'EO Melbourne',
    quote: 'Definitely recommend it to anyone',
    posterHasText: true,
  },
  {
    id: 'minh',
    src: 'https://youtu.be/wiorv1uiGvw',
    youtubeId: 'wiorv1uiGvw',
    poster: 'https://img.youtube.com/vi/wiorv1uiGvw/maxresdefault.jpg',
    name: 'Minh',
    role: 'CEO / Entrepreneur',
    room: 'Saigon build day',
  },
];

const ROOMS = [
  {
    href: `${IL}/retreats/melbourne-2026`,
    img: '/images/workshops/melbourne.webp',
    kicker: 'Chapter · Melbourne · Oct 1 – 2, 2026',
    title: 'Sixty founders shipped live software in two days',
    detail: '2 days · read the recap',
    stats: [
      { n: '25', label: 'Live sites' },
      { n: '88', label: 'NPS' },
    ],
  },
  {
    href: `${IL}/retreats/saigon`,
    img: '/images/workshops/saigon.webp',
    kicker: 'Chapter · Saigon · Jun 20, 2026',
    title: 'The room went from confused to capable',
    detail: '1 day · read the recap',
    stats: [{ n: '16', label: 'Builders' }],
  },
  {
    href: `${IL}/saigon-private`,
    img: '/images/workshops/saigon-private.webp',
    kicker: 'Private · Work Healthy Australia · Saigon',
    title: 'Flew in with a problem, flew home with the system',
    detail: 'A founder team in Thao Dien with the engineers beside them',
    stats: [{ n: '▶', label: 'Watch the film' }],
  },
];

const ENGAGEMENTS = [
  ['Oct 2026', 'EO South Pacific Ignite Conference: The Four Offices of the Future', 'Port Stephens, Australia'],
  ['Oct 2026', 'EO Melbourne: Infinite Leverage Retreat', 'Melbourne, Australia'],
  ['Jul 2026', 'AI in Action', 'San Francisco, USA'],
  ['Jul 2026', 'AI in Action', 'Seattle, USA'],
  ['Jul 2026', 'AI in Action', 'Dallas, USA'],
  ['Jul 2026', 'AI in Action', 'Denver, USA'],
  ['Jul 2026', 'DOXA Agentic AI Series', 'Online'],
  ['Jul 2026', 'AI in Action', 'Philadelphia, USA'],
  ['Jul 2026', 'Georgetown DC: Leadership in the AI Era', 'Washington DC, USA'],
  ['Jun 2026', 'EO Vietnam: Leadership in the AI Era', 'Ho Chi Minh City, Vietnam'],
  ['Jun 2026', 'Saigon Retreat', 'Saigon, Vietnam'],
  ['Jun 2026', 'Georgetown Dubai: Leadership in the AI Era', 'Dubai, UAE'],
  ['Mar 2026', 'EO Perth: The Four Offices of the Future', 'Perth, Australia'],
  ['Jan 2026', 'EO Perth AI Academy', 'Online'],
];

const DOORS = [
  {
    img: '/images/workshops/hero.webp',
    type: 'Chapters',
    title: 'Organizations like EO & YPO bring me in for members',
    who: 'Members and their guests',
    where: 'Your venue',
    shape: 'Half a day to two days',
    price: 'Quoted',
    cta: 'Plan your event',
    href: '#inquiry-form',
  },
  {
    img: '/images/workshops/corporate.webp',
    type: 'Corporate',
    title: 'We fly to your company',
    who: 'Your team, on your data',
    where: 'Your office, anywhere',
    shape: 'One to two days on site',
    price: 'Quoted',
    cta: 'Plan your event',
    href: '#inquiry-form',
  },
  {
    img: '/images/workshops/saigon-team.webp',
    type: 'Saigon private',
    title: 'Your founder team flies to us',
    who: 'One or more founders or execs',
    where: 'Thao Dien, Saigon',
    shape: 'Three to five days, engineers all day',
    price: 'From $7,000',
    cta: 'Reserve',
    href: `${IL}/saigon-private#reserve`,
  },
];

const WORKSHOP_FIELDS: InquiryField[] = [
  { name: 'name', label: 'Your Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone / WhatsApp', type: 'tel', required: true },
  { name: 'company', label: 'Organization', type: 'text' },
  { name: 'role', label: 'Your Role', type: 'text', placeholder: 'e.g. Learning chair, CEO' },
  {
    name: 'event_date',
    label: 'Event Date',
    type: 'text',
    placeholder: 'e.g. June 12, 2026 or Q3 2026',
  },
  {
    name: 'event_location',
    label: 'Event Location',
    type: 'text',
    placeholder: 'City, Country',
  },
  {
    name: 'event_format',
    label: 'Length',
    type: 'select',
    options: [
      { value: 'half-day', label: 'Half day' },
      { value: 'full-day', label: 'Full day' },
      { value: 'two-days', label: 'Two days' },
      { value: 'keynote', label: 'Keynote only (45–60 min)' },
    ],
  },
  {
    name: 'audience_size',
    label: 'Group Size',
    type: 'select',
    options: [
      { value: '<20', label: 'Under 20' },
      { value: '20-60', label: '20–60' },
      { value: '60-150', label: '60–150' },
      { value: '150+', label: '150+' },
    ],
  },
  {
    name: 'audience_type',
    label: 'Who is in the room',
    type: 'text',
    placeholder: 'e.g. EO chapter, YPO forum, executive team',
  },
  {
    name: 'message',
    label: 'Anything else?',
    type: 'textarea',
    placeholder: 'Tell me about your members, your goals, or what you want them to leave with.',
    fullWidth: true,
  },
];

const eyebrow = 'text-[11px] font-bold tracking-[0.13em] uppercase';
const h2 = 'font-black leading-[1.05] tracking-[-0.03em] text-[clamp(30px,4vw,48px)]';

export default function BookWorkshopPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative bg-[#04102D] overflow-hidden min-h-[560px] flex items-center">
        <img
          src="/images/workshops/hero.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-35"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#04102D] via-[#04102D]/85 to-[#04102D]/40" />
        <div className="relative z-10 max-w-[1080px] mx-auto px-8 sm:px-10 pt-32 pb-20 w-full">
          <div className={`text-[#6FF2C1] ${eyebrow} mb-6`}>For EO and YPO learning chairs</div>
          <h1
            className="text-white font-black leading-[1.0] tracking-[-0.04em] mb-7"
            style={{ fontSize: 'clamp(40px, 6.5vw, 72px)', maxWidth: 800 }}
          >
            Book an AI workshop
            <br />
            <span className="text-[#6FF2C1]">for your organization.</span>
          </h1>
          <p
            className="text-white/70 leading-relaxed mb-8"
            style={{ fontSize: 'clamp(16px, 1.8vw, 19px)', maxWidth: 580 }}
          >
            Not another talk about AI. Every member builds on their own business with me in the
            room, and goes home with it live.
          </p>
          <dl className="flex flex-wrap gap-x-10 gap-y-4 mb-10">
            {[
              ['Who', 'Members and their guests'],
              ['Length', 'Half a day to two days'],
              ['Venue', 'Your venue'],
            ].map(([dt, dd]) => (
              <div key={dt}>
                <dt className="text-white/45 text-[11px] font-bold tracking-[0.12em] uppercase mb-1">{dt}</dt>
                <dd className="text-white text-[15px] font-semibold">{dd}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-3">
            <a
              href="#inquiry-form"
              className="inline-block bg-[#6FF2C1] text-[#04102D] px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:bg-[#5de8b3] transition-colors"
            >
              Plan Your Event
            </a>
            <a
              href={`${IL}/retreats/melbourne-2026`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block border border-white/25 text-white px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:border-white/50 hover:bg-white/5 transition-all"
            >
              Watch the EO Melbourne Recap
            </a>
          </div>
        </div>
      </section>

      {/* ── Proof strip ──────────────────────────────────────── */}
      <section className="bg-white border-b border-[#04102D]/[0.06]">
        <div className="max-w-[1080px] mx-auto px-8 sm:px-10 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {PROOF.map((s) => (
            <div key={s.label}>
              <div className="text-[#04102D] font-black text-[clamp(36px,4vw,52px)] leading-none mb-3">
                {s.stat}
              </div>
              <div className="text-[#04102D]/60 text-[13px] font-semibold tracking-[0.06em] uppercase">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Members on camera ────────────────────────────────── */}
      <section className="bg-[#EAEEF2] py-20">
        <div className="max-w-[1080px] mx-auto px-8 sm:px-10">
          <div className="grid md:grid-cols-[1fr_1fr] gap-6 items-end mb-10">
            <div>
              <div className={`text-[#287BE8] ${eyebrow} mb-4`}>In their words</div>
              <h2 className={`text-[#04102D] ${h2}`}>
                Ask the members
                <br />
                who built.
              </h2>
            </div>
            <p className="text-[#2A3044]/75 text-[16px] leading-relaxed">
              Founders from EO Melbourne and Saigon, on camera the moment they finished.
              Tap any one to hear it.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {CLIPS.map((clip) => (
              <WorkshopClip key={clip.id} clip={clip} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Past workshops ───────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-[1080px] mx-auto px-8 sm:px-10">
          <div className={`text-[#287BE8] ${eyebrow} mb-4`}>Every workshop I have run</div>
          <h2 className={`text-[#04102D] ${h2} mb-10`}>
            The rooms
            <br />
            so far.
          </h2>
          <div className="flex flex-col gap-4">
            {ROOMS.map((r) => (
              <a
                key={r.href}
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group grid grid-cols-1 sm:grid-cols-[200px_1fr_auto] gap-5 sm:gap-8 items-center border border-[#04102D]/[0.08] rounded-lg p-4 hover:border-[#287BE8]/40 transition-colors"
              >
                <img src={r.img} alt="" loading="lazy" className="w-full aspect-[16/10] object-cover rounded-md" />
                <div>
                  <div className="text-[#287BE8] text-[11px] font-bold tracking-[0.1em] uppercase mb-2">{r.kicker}</div>
                  <h3 className="text-[#04102D] font-bold text-[20px] leading-snug mb-1 group-hover:text-[#287BE8] transition-colors">
                    {r.title}
                  </h3>
                  <p className="text-[#2A3044]/65 text-[14px]">{r.detail}</p>
                </div>
                <div className="flex gap-6 sm:pr-4">
                  {r.stats.map((s) => (
                    <div key={s.label} className="text-center">
                      <div className="text-[#04102D] font-black text-[34px] leading-none">{s.n}</div>
                      <div className="text-[#04102D]/55 text-[11px] font-bold tracking-[0.1em] uppercase mt-2">{s.label}</div>
                    </div>
                  ))}
                </div>
              </a>
            ))}
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-5 sm:gap-8 items-center border border-dashed border-[#04102D]/[0.12] rounded-lg p-4">
              <span className="hidden sm:block" />
              <div>
                <div className="text-[#287BE8] text-[11px] font-bold tracking-[0.1em] uppercase mb-2">Corporate</div>
                <h3 className="text-[#04102D] font-bold text-[20px] leading-snug mb-1">Not every client agrees to be shown</h3>
                <p className="text-[#2A3044]/65 text-[14px]">
                  Ask for references and I will put you in touch with a founder or GM who has run one.
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-[#04102D] font-bold text-[22px] mt-16 mb-5">2026 engagements</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="border-b border-[#04102D]/[0.12] text-[#04102D]/50 text-[11px] font-bold tracking-[0.1em] uppercase">
                  <th className="py-3 pr-6 font-bold">Date</th>
                  <th className="py-3 pr-6 font-bold">Event</th>
                  <th className="py-3 font-bold">Where</th>
                </tr>
              </thead>
              <tbody>
                {ENGAGEMENTS.map(([date, event, where]) => (
                  <tr key={date + event + where} className="border-b border-[#04102D]/[0.06]">
                    <td className="py-3 pr-6 text-[#04102D]/55 whitespace-nowrap">{date}</td>
                    <td className="py-3 pr-6 text-[#04102D] font-semibold">{event}</td>
                    <td className="py-3 text-[#2A3044]/70">{where}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Three ways in ────────────────────────────────────── */}
      <section className="bg-[#04102D] py-20">
        <div className="max-w-[1080px] mx-auto px-8 sm:px-10">
          <div className={`text-[#6FF2C1] ${eyebrow} mb-4`}>Three ways in</div>
          <h2 className={`text-white ${h2} mb-10`}>
            Bring the room
            <br />
            <span className="text-[#6FF2C1]">to your members.</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {DOORS.map((d) => (
              <article key={d.type} className="bg-white/[0.04] border border-white/10 rounded-lg overflow-hidden flex flex-col">
                <img src={d.img} alt="" loading="lazy" className="w-full aspect-[16/10] object-cover" />
                <div className="p-6 flex flex-col flex-1">
                  <div className="text-[#6FF2C1] text-[11px] font-bold tracking-[0.12em] uppercase mb-3">{d.type}</div>
                  <h3 className="text-white font-bold text-[19px] leading-snug mb-5">{d.title}</h3>
                  <dl className="space-y-3 mb-6">
                    {[
                      ['Who', d.who],
                      ['Where', d.where],
                      ['Shape', d.shape],
                    ].map(([dt, dd]) => (
                      <div key={dt}>
                        <dt className="text-white/40 text-[10px] font-bold tracking-[0.12em] uppercase">{dt}</dt>
                        <dd className="text-white/85 text-[14px]">{dd}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-white font-bold text-[15px]">{d.price}</span>
                    <a
                      href={d.href}
                      className="border border-white/25 text-white px-5 py-2.5 rounded-[7px] text-[12px] font-bold tracking-[0.06em] uppercase hover:border-white/50 hover:bg-white/5 transition-all"
                    >
                      {d.cta}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="text-white/50 text-[14px] mt-10 max-w-2xl">
            Need a talk instead? <strong className="text-white/80">The Four Offices of the Future</strong> is
            available as a 45 to 60 minute keynote. Pick &ldquo;Keynote only&rdquo; in the form below.
          </p>
        </div>
      </section>

      {/* ── Inquiry form ─────────────────────────────────────── */}
      <section id="inquiry-form" className="bg-[#04102D] border-t border-white/10 py-20 scroll-mt-16">
        <div className="max-w-[1080px] mx-auto px-8 sm:px-10">
          <div className="text-center mb-12">
            <div className={`text-[#6FF2C1] ${eyebrow} mb-4`}>Plan your event</div>
            <h2 className="text-white font-black leading-tight mb-4 text-[clamp(28px,3.5vw,42px)]">
              Bring your chapter. I bring the engineers.
            </h2>
            <p className="text-white/55 text-[16px] leading-relaxed max-w-xl mx-auto">
              Grab a time on my calendar, or send the details and I&apos;ll get back to you within
              the day.
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div>
              <h3 className="text-white font-bold text-[18px] mb-5">Send the details</h3>
              <InquiryForm inquiryType="keynote" fields={WORKSHOP_FIELDS} submitLabel="Send Inquiry" />
            </div>
            <div className="lg:sticky lg:top-24">
              <div className="flex items-baseline justify-between mb-5">
                <h3 className="text-white font-bold text-[18px]">Book a time directly</h3>
                <a
                  href={SCHEDULER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#6FF2C1] text-[13px] font-semibold underline hover:no-underline"
                >
                  Open in new tab
                </a>
              </div>
              <div className="bg-white rounded-lg overflow-hidden">
                <iframe
                  src={SCHEDULER_URL}
                  title="Book a time with Dave"
                  className="w-full h-[720px] border-0"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
