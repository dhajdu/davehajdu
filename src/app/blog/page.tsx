'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  featured?: boolean;
  image?: string;
  dayNumber?: number;
};

const POSTS: Post[] = [
  {
    slug: 'fire-horse-2026',
    title: 'Year of the Fire Horse 2026: Week One Already Has Me By the Throat',
    excerpt:
      "The Year of the Fire Horse started on February 17th. By the end of the first week, I'd already lived through a revenue high, the worst product failure of my career, and a perfect score in a leadership class. Three massive swings in seven days.",
    date: 'Feb 28, 2026',
    readTime: '5 min',
    category: 'High Performance Culture',
    tags: ['high-performance-culture'],
    featured: true,
    image: '/images/dave-speaking.jpg',
  },
  {
    slug: 'entrepreneurial-learnings',
    title: "18 Entrepreneurial Learnings from a Founder Who Built Businesses in the World's Toughest Markets",
    excerpt:
      'I learned so much about the 50% of leadership that we all know matters — the human side. The relationships. The hard-won wisdom that only comes from building something real in difficult places.',
    date: 'Feb 2, 2026',
    readTime: '6 min',
    category: 'High Performance Culture',
    tags: ['high-performance-culture', 'doing-business-in-vietnam'],
    image: '/images/speaking-podium.jpg',
  },
  {
    slug: 'ai-officer-mindset',
    title: 'AI Officer Mindset: From Learning to Results in 12 Hours',
    excerpt:
      'Ms. Trang from Pasteur Street Brewing Company attended our AI After Dark workshop. Less than 12 hours later, she had already built her digital twin and put it to work. Here is what that tells us about the gap between learning and doing.',
    date: 'Oct 17, 2025',
    readTime: '4 min',
    category: 'AI In Business',
    tags: ['ai-in-business'],
    image: '/images/dave-workshop.jpg',
  },
  {
    slug: 'ai-avatar-digital-twin',
    title: 'Day 21/88: Your AI Avatar Is Your Digital Twin',
    excerpt:
      'AI avatar quality starts with source setup. Clean lighting, steady framing, crisp audio. Your avatar mirrors input quality. Digital twin on your best day — not just believable, magnetic.',
    date: 'Nov 6, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai', 'branding-with-ai'],
    dayNumber: 21,
  },
  {
    slug: 'ai-video-beat-sync',
    title: 'Day 20/88: Nail Your Beat Cuts Using AI Video Beat Sync',
    excerpt:
      'AI video beat sync transforms editing into musical composition. Cut to rhythm, not seconds. Match emotion to beats. Transitions as musical bridges. Feel every transition. 2x impact.',
    date: 'Nov 5, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai'],
    dayNumber: 20,
  },
  {
    slug: 'ai-video-visual-consistency',
    title: 'Day 19/88: Your Story Deserves Harmony with AI Video Visual Consistency',
    excerpt:
      'AI video visual consistency separates amateur from cinematic. Clashing styles kill stories. Align colors, fonts, transitions. Visual harmony builds trust. Cohesion creates narrative.',
    date: 'Nov 4, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai'],
    dayNumber: 19,
  },
  {
    slug: 'plan-ai-shots-google-flow',
    title: 'Day 18/88: Before You Hit Record, Plan Your AI Shots with Google Flow',
    excerpt:
      'AI video planning eliminates chaos. Before you hit record, map six story beats, plan transitions, build visual flow. Structure over equipment. Plan flows, story shines. Save hours.',
    date: 'Nov 3, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai'],
    dayNumber: 18,
  },
  {
    slug: 'master-ai-image-quality',
    title: 'Day 17/88: Master AI Image Quality and Stop Letting Blur Kill Your Ideas',
    excerpt:
      'AI image quality defines professionalism. Blur kills ideas. Master export settings: aspect ratio, HD resolution (1920x1080+), DPI (300 print / 72 web). Sharp edges. Two clicks.',
    date: 'Oct 31, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai'],
    dayNumber: 17,
  },
  {
    slug: 'brand-visually-unmistakable',
    title: 'Day 16/88: Make Your Brand Visually Unmistakable with AI Consistency',
    excerpt:
      'AI brand consistency creates recognition. Define your visual DNA once: colors, fonts, lighting. Build your preset. Scale with AI. Recognition before the logo. System not style.',
    date: 'Oct 30, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai', 'branding-with-ai'],
    dayNumber: 16,
  },
  {
    slug: 'ai-image-variations',
    title: 'Day 15/88: Master AI Image Variations by Remixing One Idea into Five Scroll-Stopping Visuals',
    excerpt:
      'AI image variations turn one idea into five visuals. Use modifiers for lighting, perspective, mood. Control seeds for consistency. Negative prompts keep it clean. Creative direction.',
    date: 'Oct 29, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai', 'branding-with-ai'],
    dayNumber: 15,
  },
  {
    slug: 'automation-workflow-as-product',
    title: 'Day 14/88: Treat Your Automation Workflow Like a Product: Test, Break, and Perfect It',
    excerpt:
      "Automation workflow reliability requires testing. Don't set and forget. Run chaos tests, find weak points, add recovery systems. Test, break, perfect before it breaks you.",
    date: 'Oct 28, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai', 'ai-in-business'],
    dayNumber: 14,
  },
  {
    slug: 'ai-task-automation',
    title: 'Day 13/88: Automate Your Grind with AI Task Automation and Reclaim Hours for Real Ideas',
    excerpt:
      'AI task automation reclaims time: automate one 10-minute daily task, save 50 hours yearly. Use trigger-action logic with AI tools. Small automations compound into real productivity.',
    date: 'Oct 27, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai', 'ai-in-business'],
    dayNumber: 13,
  },
  {
    slug: 'map-workflow-ai-productivity',
    title: 'Day 12/88: Map Your Workflow to Unlock AI Productivity',
    excerpt:
      "AI workflow mapping turns chaos into productivity. Can't automate what you can't see. Map processes step-by-step, find bottlenecks, assign owners. Structure before automation.",
    date: 'Oct 24, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai', 'ai-in-business'],
    dayNumber: 12,
  },
  {
    slug: 'ai-prompt-training',
    title: 'Day 11/88: Stop Wishing AI Would Understand You and Start AI Prompt Training Instead',
    excerpt:
      'AI prompt training transforms results. Stop wishing AI understands you — train it instead. Co-create prompts, teach your thinking patterns, build shared language. Trainers win.',
    date: 'Oct 23, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai', 'ai-in-business'],
    dayNumber: 11,
  },
  {
    slug: 'viral-content-hooks',
    title: "Day 10/88: Most Creators Don't Realize Viral Content Hooks Are Won or Lost in 3 Seconds",
    excerpt:
      'Viral content hooks succeed in 3 seconds. Most creators fail because they skip the framework. Use 6 elements: clarity, action, transformation, contrast, proof, time. AI multiplies this.',
    date: 'Oct 22, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai', 'ai-in-business'],
    dayNumber: 10,
  },
  {
    slug: 'lead-with-ai',
    title: "Day 9/88: You Don't Need Permission to Lead with AI, Just the Courage to Start",
    excerpt:
      "Lead with AI without waiting for permission. That title isn't coming. Build one solution this week: automate reports, create prompts, solve pain points. AI Officers take initiative.",
    date: 'Oct 21, 2025',
    readTime: '1 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai', 'ai-in-business'],
    dayNumber: 9,
  },
  {
    slug: '15-minutes-daily-ai',
    title: 'Day 8/88: Why 15 Minutes Daily With AI Beats 3 Hours Monthly',
    excerpt:
      'Daily AI practice beats monthly cramming. 15 min daily > 3 hours monthly. Small reps compound fast. AI thinking becomes automatic. Build muscle memory, not course collection.',
    date: 'Oct 20, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai'],
    dayNumber: 8,
  },
  {
    slug: 'three-connected-ai-tools',
    title: 'Day 7/88: Three Connected AI Tools Beat Ten Disconnected Ones',
    excerpt:
      'Connected AI tools beat disconnected stacks. Stop collecting. Pick 3 you actually use, connect them through Zapier or workflows. Your image AI feeds your writer feeds your database.',
    date: 'Oct 17, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai', 'ai-in-business'],
    dayNumber: 7,
  },
  {
    slug: 'ai-automation-not-robots',
    title: "Day 6/88: AI Automation Isn't About Robots Replacing You",
    excerpt:
      "AI automation isn't about robots replacing people. It's about fixing your Tuesday afternoon. Map your weekly tasks, find the boring middle, hand it to AI. Keep strategy.",
    date: 'Oct 16, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai', 'ai-in-business'],
    dayNumber: 6,
  },
  {
    slug: 'train-ai-to-write-like-you',
    title: 'Day 5/88: Train AI to Write Like You, Not the Other Way Around',
    excerpt:
      'Train AI to write like you by creating a voice file of your best emails, posts, and reports. Feed these examples first. Stop sounding robotic. Amplify your voice 10x.',
    date: 'Oct 15, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai', 'branding-with-ai'],
    dayNumber: 5,
  },
];

const FILTERS = [
  { label: 'All Posts', value: 'all' },
  { label: 'High Performance Culture', value: 'high-performance-culture' },
  { label: 'AI In Business', value: 'ai-in-business' },
  { label: '88 Days of AI', value: '88-days-of-ai' },
  { label: 'Doing Business in Vietnam', value: 'doing-business-in-vietnam' },
  { label: 'Branding with AI', value: 'branding-with-ai' },
];

const CATEGORY_COLORS: Record<string, string> = {
  'High Performance Culture': 'bg-[#287BE8]/15 text-[#287BE8]',
  'AI In Business': 'bg-[#D1458B]/15 text-[#D1458B]',
  '88 Days of AI': 'bg-[#6FF2C1]/20 text-[#1A9E74]',
  'Branding with AI': 'bg-purple-100 text-purple-700',
};

const DAY_GRADIENTS = [
  'from-[#0d1b3e] to-[#1a2d5a]',
  'from-[#1a0d3e] to-[#2d1a5a]',
  'from-[#0d2e1b] to-[#1a5a2d]',
  'from-[#3e0d1b] to-[#5a1a2d]',
  'from-[#0d1e3e] to-[#163a6e]',
];

function PostCard({ post }: { post: Post }) {
  const gradient = DAY_GRADIENTS[(post.dayNumber ?? 0) % DAY_GRADIENTS.length];
  const categoryColor = CATEGORY_COLORS[post.category] ?? 'bg-gray-100 text-gray-600';

  return (
    <article className="bg-white rounded-xl border border-[#D4D9E0] overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col">
      {/* Card image / day-number graphic */}
      <div className={`relative h-44 w-full overflow-hidden bg-gradient-to-br ${gradient} flex-shrink-0`}>
        {post.image ? (
          <Image src={post.image} alt={post.title} fill className="object-cover" />
        ) : post.dayNumber ? (
          <div className="absolute inset-0 flex items-center justify-center select-none">
            <div className="text-center">
              <div className="text-[72px] font-black text-white/8 leading-none">{post.dayNumber}</div>
              <div className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#6FF2C1] mt-1">
                Day {post.dayNumber} / 88
              </div>
            </div>
          </div>
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <span
          className={`inline-block text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded-full mb-3 self-start ${categoryColor}`}
        >
          {post.category}
        </span>
        <h3 className="font-bold text-[#04102D] text-[15px] leading-snug mb-2 flex-1">
          <Link href={`/blog/${post.slug}`} className="hover:text-[#287BE8] transition-colors">
            {post.title}
          </Link>
        </h3>
        <p className="text-[13px] text-[#6B7280] leading-relaxed mb-4 line-clamp-3">{post.excerpt}</p>
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#D4D9E0]">
          <time className="text-[12px] text-[#6B7280]">{post.date}</time>
          <Link
            href={`/blog/${post.slug}`}
            className="text-[12px] font-semibold text-[#287BE8] hover:text-[#04102D] transition-colors"
          >
            Read Article →
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function BlogIndex() {
  const [activeTag, setActiveTag] = useState('all');

  const featured = POSTS.find((p) => p.featured) ?? POSTS[0];
  const filteredPosts = POSTS.filter((p) =>
    activeTag === 'all' ? true : p.tags.includes(activeTag)
  );

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative bg-[#04102D] overflow-hidden min-h-[380px] flex items-center">
        <div className="absolute inset-0">
          {/* Gradient overlay — keeps text readable regardless of photo */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#04102D] via-[#04102D]/85 to-[#04102D]/40 z-10" />
          {/* Hero photo — replace with your preferred speaking/portrait photo */}
          <Image
            src="/images/dave-speaking.jpg"
            alt="Dave Hajdu speaking"
            fill
            className="object-cover object-top opacity-50"
            priority
          />
        </div>

        <div className="relative z-20 max-w-[1100px] mx-auto px-8 max-md:px-5 py-16 md:py-24">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#6FF2C1] mb-4 flex items-center gap-2">
            <span className="inline-block w-8 h-px bg-[#6FF2C1]" />
            Dave Hajdu · Blog
          </p>
          <h1 className="text-[42px] md:text-[56px] font-black text-white leading-[1.05] mb-5 max-w-[600px]">
            AI + Business{' '}
            <span className="text-[#6FF2C1]">Insights</span>
          </h1>
          <p className="text-[16px] text-white/70 max-w-[480px] leading-relaxed mb-8">
            Real stories, practical frameworks, and honest takes on building businesses with AI — from someone doing it in real time.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-4 py-1.5 rounded-full border border-[#287BE8]/50 text-[#287BE8] text-[12px] font-semibold">
              High Performance Culture
            </span>
            <span className="px-4 py-1.5 rounded-full border border-[#D1458B]/50 text-[#D1458B] text-[12px] font-semibold">
              AI In Business
            </span>
            <span className="px-4 py-1.5 rounded-full border border-[#6FF2C1]/50 text-[#6FF2C1] text-[12px] font-semibold">
              88 Days of AI
            </span>
          </div>
        </div>
      </section>

      {/* ── Intro Band ───────────────────────────────────────── */}
      <div className="bg-[#F8F9FC] border-y border-[#D4D9E0]">
        <div className="max-w-[800px] mx-auto px-8 max-md:px-5 py-8 text-center text-[15px] text-[#2A3044] leading-relaxed">
          Most AI content teaches you what AI can do.{' '}
          <strong className="text-[#04102D]">
            These posts teach you what to do with AI — as a founder, a leader, and a business builder.
          </strong>{' '}
          Tested in the real world, not the lab.
        </div>
      </div>

      {/* ── Featured Post ────────────────────────────────────── */}
      <section className="py-14">
        <div className="max-w-[1100px] mx-auto px-8 max-md:px-5">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#287BE8] mb-5">Featured</p>

          <article className="relative rounded-2xl overflow-hidden bg-[#04102D] min-h-[280px] flex items-end">
            {featured.image && (
              <>
                <Image
                  src={featured.image}
                  alt={featured.title}
                  fill
                  className="object-cover opacity-25"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#04102D]/95 via-[#04102D]/75 to-transparent" />
              </>
            )}
            <div className="relative z-10 p-8 md:p-12 max-w-[680px]">
              <span className="inline-block text-[10px] font-bold tracking-[0.12em] uppercase px-3 py-1 rounded-full bg-[#287BE8] text-white mb-4">
                {featured.category}
              </span>
              <h2 className="text-[24px] md:text-[30px] font-black text-white leading-snug mb-3">
                <Link href={`/blog/${featured.slug}`} className="hover:text-[#6FF2C1] transition-colors">
                  {featured.title}
                </Link>
              </h2>
              <p className="text-white/70 text-[14px] leading-relaxed mb-5 max-w-[520px]">
                {featured.excerpt}
              </p>
              <div className="flex items-center gap-4">
                <time className="text-[12px] text-white/50">{featured.date}</time>
                <Link
                  href={`/blog/${featured.slug}`}
                  className="text-[13px] font-semibold text-[#6FF2C1] hover:text-white transition-colors"
                >
                  Read Article →
                </Link>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* ── Filter Bar ───────────────────────────────────────── */}
      <section className="sticky top-[57px] z-30 bg-white border-y border-[#D4D9E0] shadow-sm">
        <div className="max-w-[1100px] mx-auto px-8 max-md:px-5">
          <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setActiveTag(f.value)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  activeTag === f.value
                    ? 'bg-[#04102D] text-white'
                    : 'bg-[#F0F2F5] text-[#6B7280] hover:bg-[#E0E4EA] hover:text-[#04102D]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── All Posts Grid ───────────────────────────────────── */}
      <section className="py-14">
        <div className="max-w-[1100px] mx-auto px-8 max-md:px-5">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#6B7280] mb-8">
            {activeTag === 'all'
              ? `All Posts — ${POSTS.length}`
              : `${FILTERS.find((f) => f.value === activeTag)?.label} — ${filteredPosts.length}`}
          </p>

          {filteredPosts.length === 0 ? (
            <p className="text-[#6B7280] text-center py-16">No posts in this category yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredPosts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Band ─────────────────────────────────────────── */}
      <section className="bg-[#04102D] py-14">
        <div className="max-w-[640px] mx-auto px-8 max-md:px-5 text-center">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#6FF2C1] mb-3">Work with Dave</p>
          <h2 className="text-[28px] font-black text-white mb-4 leading-snug">
            Ready to bring AI into your business — not just your conversations?
          </h2>
          <p className="text-white/60 text-[14px] mb-8 leading-relaxed">
            Dave works with founders and leadership teams to build real AI strategies, not just talking points.
          </p>
          <Link
            href="/#contact"
            className="inline-block bg-[#287BE8] text-white text-[13px] font-bold px-8 py-3 rounded-lg hover:bg-[#1a6ad4] transition-colors"
          >
            Book a Call with Dave →
          </Link>
        </div>
      </section>
    </>
  );
}
