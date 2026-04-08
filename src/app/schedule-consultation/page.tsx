import type { Metadata } from 'next';
import InquiryForm, { type InquiryField } from '@/components/InquiryForm';

export const metadata: Metadata = {
  title: 'Schedule a Consultation | Dave Hajdu',
  description:
    '30–45 minute consultation. Walk away with clarity on where AI fits your business and what to do next. Generative, Agentic, or both — for executives, operators, and L&D leaders.',
};

const SCHEDULER_URL = 'https://edge8company.sg.larksuite.com/scheduler/10cad5fa7c2d720b';

const CONSULTATION_FIELDS: InquiryField[] = [
  { name: 'name', label: 'Your Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone / WhatsApp', type: 'tel', required: true },
  { name: 'company', label: 'Company', type: 'text' },
  { name: 'role', label: 'Your Role', type: 'text' },
  {
    name: 'company_size',
    label: 'Company Size',
    type: 'select',
    options: [
      { value: '1-10', label: '1–10' },
      { value: '11-50', label: '11–50' },
      { value: '51-200', label: '51–200' },
      { value: '201-1000', label: '201–1,000' },
      { value: '1000+', label: '1,000+' },
    ],
  },
  {
    name: 'timeline',
    label: 'Timeline',
    type: 'select',
    options: [
      { value: 'immediate', label: 'Immediate (this month)' },
      { value: '1-3 months', label: '1–3 months' },
      { value: '3-6 months', label: '3–6 months' },
      { value: 'exploring', label: 'Exploring' },
    ],
  },
  {
    name: 'challenge',
    label: 'What is your biggest AI challenge right now?',
    type: 'textarea',
    placeholder: 'A few sentences about where you are stuck or what you want to figure out.',
    fullWidth: true,
  },
  {
    name: 'message',
    label: 'Anything else?',
    type: 'textarea',
    placeholder: 'Optional context, links, or constraints I should know about.',
    fullWidth: true,
  },
];

export default function ScheduleConsultationPage() {
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
        <div className="relative z-20 max-w-[1080px] mx-auto px-8 sm:px-5 pt-32 pb-20 w-full">
          <div className="text-[#6FF2C1] text-[11px] font-bold tracking-[0.13em] uppercase mb-6">
            Schedule a Consultation
          </div>
          <h1
            className="text-white font-black leading-[1.0] tracking-[-0.04em] mb-7"
            style={{ fontSize: 'clamp(40px, 6.5vw, 72px)', maxWidth: 760 }}
          >
            30–45 minutes.
            <br />
            <span className="text-[#6FF2C1]">Clarity and next steps.</span>
          </h1>
          <p
            className="text-white/60 leading-relaxed mb-10"
            style={{ fontSize: 'clamp(16px, 1.8vw, 19px)', maxWidth: 580 }}
          >
            A focused conversation about where AI fits your business, what to prioritize,
            and how to actually move. No tool tutorials. No slides for the sake of slides.
            You leave with a real plan.
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

      {/* ── What this covers ─────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-[1080px] mx-auto px-8 sm:px-5">
          <div className="text-[#287BE8] text-[11px] font-bold tracking-[0.13em] uppercase mb-4">
            What this conversation covers
          </div>
          <h2 className="text-[#04102D] font-black leading-tight mb-10 text-[clamp(28px,3.5vw,42px)]">
            In 30–45 minutes, we will:
          </h2>
          <div className="grid md:grid-cols-2 gap-x-10 gap-y-5">
            {[
              'Assess your current AI maturity',
              'Identify workflow and capability gaps',
              'Determine whether Generative, Agentic, or both tracks fit',
              'Outline delivery options (online, in-person, hybrid)',
              'Discuss cohort size and pricing structure',
              'Leave with clarity and next steps',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6FF2C1] mt-2.5 flex-shrink-0" />
                <span className="text-[#04102D]/80 text-[16px]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who should fill this out ─────────────────────────── */}
      <section className="bg-[#F7F8FA] py-20">
        <div className="max-w-[1080px] mx-auto px-8 sm:px-5">
          <h2 className="text-[#04102D] font-black leading-tight mb-10 text-[clamp(28px,3.5vw,42px)]">
            Who should book this
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: 'Executives responsible for AI investment',
                body: 'You are the one who has to justify the spend and prove the return. You need a clear path, not more vendor decks.',
              },
              {
                title: 'Heads of Operations or Innovation',
                body: 'You are translating leadership ambition into actual workflows. You need a framework that survives contact with reality.',
              },
              {
                title: 'L&D leaders deploying capability programs',
                body: 'You need cohort-ready content that makes leaders better at AI, not just more aware of it.',
              },
              {
                title: 'Department leaders driving automation',
                body: 'You are looking for the highest-leverage workflow to attack first, and a way to measure whether it worked.',
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

      {/* ── Inquiry form ─────────────────────────────────────── */}
      <section id="inquiry-form" className="bg-[#04102D] py-20">
        <div className="max-w-[760px] mx-auto px-8 sm:px-5">
          <div className="text-center mb-10">
            <div className="text-[#6FF2C1] text-[11px] font-bold tracking-[0.13em] uppercase mb-4">
              Send Details
            </div>
            <h2 className="text-white font-black leading-tight mb-4 text-[clamp(28px,3.5vw,42px)]">
              Tell me where you are stuck
            </h2>
            <p className="text-white/55 text-[16px] leading-relaxed max-w-xl mx-auto">
              Prefer to share context first? Fill this out and I&apos;ll get back to you
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
            inquiryType="consultation"
            fields={CONSULTATION_FIELDS}
            submitLabel="Send Inquiry"
          />
        </div>
      </section>
    </>
  );
}
