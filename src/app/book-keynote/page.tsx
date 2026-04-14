import type { Metadata } from 'next';
import InquiryForm, { type InquiryField } from '@/components/InquiryForm';

export const metadata: Metadata = {
  title: 'Book Dave Hajdu — AI Keynote Speaker for Leaders & Executives',
  description:
    'Book Dave Hajdu to speak at your event. Keynotes that change how leaders think about AI. $1,000–$4,000 based on duration and travel. EO chapter discounts available.',
};

const SCHEDULER_URL = 'https://edge8company.sg.larksuite.com/scheduler/d110260f235911c8';

const KEYNOTE_FIELDS: InquiryField[] = [
  { name: 'name', label: 'Your Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone / WhatsApp', type: 'tel', required: true },
  { name: 'company', label: 'Organization', type: 'text' },
  { name: 'role', label: 'Your Role', type: 'text' },
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
    label: 'Format',
    type: 'select',
    options: [
      { value: 'in-person', label: 'In-person' },
      { value: 'virtual', label: 'Virtual' },
      { value: 'hybrid', label: 'Hybrid' },
    ],
  },
  {
    name: 'audience_size',
    label: 'Audience Size',
    type: 'select',
    options: [
      { value: '<50', label: 'Under 50' },
      { value: '50-150', label: '50–150' },
      { value: '150-500', label: '150–500' },
      { value: '500+', label: '500+' },
    ],
  },
  {
    name: 'audience_type',
    label: 'Audience Type',
    type: 'text',
    placeholder: 'e.g. EO chapter, conference, corporate offsite',
  },
  {
    name: 'topic_interest',
    label: 'Topic Interest',
    type: 'text',
    placeholder: 'e.g. The Four Offices of the Future',
    fullWidth: true,
  },
  {
    name: 'budget_range',
    label: 'Budget Range',
    type: 'select',
    fullWidth: true,
    options: [
      { value: '$1,000–$2,000', label: '$1,000–$2,000' },
      { value: '$2,000–$3,000', label: '$2,000–$3,000' },
      { value: '$3,000–$4,000', label: '$3,000–$4,000' },
      { value: 'EO chapter (discount)', label: 'EO chapter (discount)' },
    ],
  },
  {
    name: 'message',
    label: 'Anything else?',
    type: 'textarea',
    placeholder: 'Tell me about your event, audience, or specific outcomes you want.',
    fullWidth: true,
  },
];

export default function BookKeynotePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative bg-[#04102D] overflow-hidden min-h-[420px] flex items-center">
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 70% at 15% 55%, rgba(40,123,232,0.12) 0%, transparent 65%)',
          }}
        />
        <div className="relative z-20 max-w-[1080px] mx-auto px-8 sm:px-10 pt-32 pb-20 w-full">
          <div className="text-[#6FF2C1] text-[11px] font-bold tracking-[0.13em] uppercase mb-6">
            Book a Keynote
          </div>
          <h1
            className="text-white font-black leading-[1.0] tracking-[-0.04em] mb-7"
            style={{ fontSize: 'clamp(40px, 6.5vw, 72px)', maxWidth: 760 }}
          >
            Keynotes that change how
            <br />
            <span className="text-[#6FF2C1]">leaders think about AI.</span>
          </h1>
          <p
            className="text-white/60 leading-relaxed mb-10"
            style={{ fontSize: 'clamp(16px, 1.8vw, 19px)', maxWidth: 580 }}
          >
            Most AI talks teach tools. These teach leaders what to do when the tools
            aren&apos;t the problem. 95% of organizations still see no measurable return
            from AI. The bottleneck isn&apos;t technology. It&apos;s leadership capacity.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={SCHEDULER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#6FF2C1] text-[#04102D] px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:bg-[#5de8b3] transition-colors"
            >
              Pick a Time
            </a>
            <a
              href="#inquiry-form"
              className="inline-block border border-white/25 text-white px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:border-white/50 hover:bg-white/5 transition-all"
            >
              Send Details
            </a>
          </div>
        </div>
      </section>

      {/* ── Pricing strip ────────────────────────────────────── */}
      <div className="bg-white border-b border-[#04102D]/[0.06]">
        <div className="max-w-[1080px] mx-auto px-8 sm:px-10 py-8 text-center">
          <p className="text-[#04102D]/70 text-[16px] leading-relaxed">
            <strong className="text-[#04102D]">$1,000–$4,000</strong> based on
            duration and travel. Discounts available for EO chapters.
          </p>
        </div>
      </div>

      {/* ── Signature talk ───────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-[1080px] mx-auto px-8 sm:px-10">
          <div className="text-[#287BE8] text-[11px] font-bold tracking-[0.13em] uppercase mb-4">
            Signature Keynote
          </div>
          <h2 className="text-[#04102D] font-black leading-tight mb-6 text-[clamp(28px,3.5vw,42px)]">
            The Four Offices of the Future
          </h2>
          <p className="text-[#04102D]/70 text-[17px] leading-relaxed mb-10 max-w-2xl">
            A framework that maps four business outcomes — Revenue, Talent, Operations,
            Innovation — to where AI actually creates leverage. Available as a 45–60
            minute keynote or as a 4-hour hands-on workshop where participants leave
            with a working prototype.
          </p>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: 'Four Offices, Four Outcomes',
                body: 'A clean map from your business outcomes to the AI workflows that move them. No tool worship.',
              },
              {
                title: 'Documented Workflow',
                body: 'Participants leave with one of their own workflows fully mapped from strategy to execution.',
              },
              {
                title: 'Working Prototype',
                body: 'In the workshop format, every participant builds a vibe-coded prototype that runs the workflow.',
              },
              {
                title: 'Repeatable Pattern',
                body: 'A pattern you and your team can run on the next workflow, and the one after that.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="border border-[#04102D]/[0.08] rounded-lg p-6 bg-white"
              >
                <div className="font-bold text-[#04102D] text-[15px] mb-2">
                  {item.title}
                </div>
                <div className="text-[#04102D]/65 text-[14px] leading-relaxed">
                  {item.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof ─────────────────────────────────────── */}
      <section className="bg-[#F7F8FA] py-16">
        <div className="max-w-[1080px] mx-auto px-8 sm:px-10">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { stat: '9.3 / 10', label: 'Mean session rating across 66 attendees' },
              { stat: '79%', label: 'Rated the session a 9 or 10' },
              { stat: '71%', label: 'Reported a meaningful shift or breakthrough' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-[#04102D] font-black text-[clamp(36px,4vw,52px)] leading-none mb-3">
                  {s.stat}
                </div>
                <div className="text-[#04102D]/60 text-[14px] leading-relaxed">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who this is for ──────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-[1080px] mx-auto px-8 sm:px-10">
          <h2 className="text-[#04102D] font-black leading-tight mb-10 text-[clamp(28px,3.5vw,42px)]">
            Who this is for
          </h2>
          <div className="grid md:grid-cols-2 gap-x-10 gap-y-4">
            {[
              'Founder and CEO communities (EO chapters, YPO, Vistage)',
              'Conference programmers building AI tracks for leaders',
              'Corporate offsites for executive teams',
              'University programs and executive education',
              'Industry associations addressing AI adoption at scale',
              'Leadership summits ready to move past tool tutorials',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6FF2C1] mt-2.5 flex-shrink-0" />
                <span className="text-[#04102D]/80 text-[16px]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Inquiry form ─────────────────────────────────────── */}
      <section id="inquiry-form" className="bg-[#04102D] py-20">
        <div className="max-w-[760px] mx-auto px-8 sm:px-10">
          <div className="text-center mb-10">
            <div className="text-[#6FF2C1] text-[11px] font-bold tracking-[0.13em] uppercase mb-4">
              Send Details
            </div>
            <h2 className="text-white font-black leading-tight mb-4 text-[clamp(28px,3.5vw,42px)]">
              Tell me about your event
            </h2>
            <p className="text-white/55 text-[16px] leading-relaxed max-w-xl mx-auto">
              Prefer to share details first? Fill this out and I&apos;ll get back to you
              within the day. Or{' '}
              <a
                href={SCHEDULER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6FF2C1] underline hover:no-underline"
              >
                pick a time directly
              </a>
              .
            </p>
          </div>
          <InquiryForm
            inquiryType="keynote"
            fields={KEYNOTE_FIELDS}
            submitLabel="Send Inquiry"
          />
        </div>
      </section>
    </>
  );
}
