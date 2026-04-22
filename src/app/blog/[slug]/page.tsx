import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { POSTS, BLOCKS_BY_SLUG, type Block } from '@/lib/posts-data';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return POSTS.map((post) => ({ slug: post.slug }));
}

// SEO-optimized shorter titles for posts whose full display title exceeds 60 chars
const SEO_TITLE_OVERRIDES: Record<string, string> = {
  'ai-officer-mindset': 'AI Officer Mindset: Learning to Results in 12 Hours',
  'entrepreneurial-learnings': '18 Entrepreneurial Learnings from Tough Markets',
  'fire-horse-2026': 'Year of the Fire Horse 2026: Week One Lessons',
  'supabase-for-non-technical-founders': 'Supabase for Non-Technical Founders',
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) return {};
  const ogImage = post.image ? [post.image] : undefined;
  const seoTitleBase = SEO_TITLE_OVERRIDES[slug] || post.title;
  return {
    title: `${seoTitleBase} | Dave Hajdu`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: `/blog/${post.slug}`,
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: ogImage,
    },
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  'High Performance Culture': 'bg-[#287BE8]/15 text-[#287BE8]',
  'AI In Business': 'bg-[#D1458B]/15 text-[#D1458B]',
  'Branding with AI': 'bg-purple-100 text-purple-700',
};

const DAY_GRADIENTS = [
  'from-[#0d1b3e] to-[#1a2d5a]',
  'from-[#1a0d3e] to-[#2d1a5a]',
  'from-[#0d2e1b] to-[#1a5a2d]',
  'from-[#3e0d1b] to-[#5a1a2d]',
  'from-[#0d1e3e] to-[#163a6e]',
];

function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="prose-custom">
      {blocks.map((block, i) => {
        switch (block.tag) {
          case 'h1':
            return (
              <h1 key={i} className="text-[28px] md:text-[34px] font-black text-[#04102D] mt-10 mb-4 leading-snug">
                {block.text}
              </h1>
            );
          case 'h2':
            return (
              <h2 key={i} className="text-[22px] md:text-[26px] font-bold text-[#04102D] mt-8 mb-3 leading-snug">
                {block.text}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={i} className="text-[18px] font-bold text-[#04102D] mt-7 mb-2 leading-snug">
                {block.text}
              </h3>
            );
          case 'h4':
          case 'h5':
            return (
              <h4 key={i} className="text-[15px] font-bold text-[#04102D] mt-6 mb-2 uppercase tracking-wide">
                {block.text}
              </h4>
            );
          case 'blockquote':
            return (
              <blockquote
                key={i}
                className="border-l-4 border-[#287BE8] pl-5 my-6 text-[15px] italic text-[#2A3044] bg-[#F8F9FC] py-3 pr-4 rounded-r-lg"
              >
                {block.text}
              </blockquote>
            );
          case 'li':
            return (
              <div key={i} className="flex gap-3 my-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#287BE8] flex-shrink-0 mt-2" />
                <p className="text-[15px] text-[#2A3044] leading-relaxed">{block.text}</p>
              </div>
            );
          case 'gallery':
            return (
              <figure key={i} className="my-10 not-prose">
                <div className="grid grid-cols-2 gap-3">
                  {(block.images ?? []).map((src, j) => (
                    <div
                      key={j}
                      className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[#F0F2F5]"
                    >
                      <Image
                        src={src}
                        alt={`${block.caption ?? 'Photo'} ${j + 1}`}
                        fill
                        sizes="(min-width: 768px) 360px, 50vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
                {block.caption && (
                  <figcaption className="text-[12px] text-[#6B7280] italic mt-3 text-center">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          case 'p':
          default:
            return (
              <p key={i} className="text-[15px] md:text-[16px] text-[#2A3044] leading-relaxed my-4">
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  const blocks = BLOCKS_BY_SLUG[slug] ?? [];
  const gradient = DAY_GRADIENTS[(post.dayNumber ?? 0) % DAY_GRADIENTS.length];
  const categoryColor = CATEGORY_COLORS[post.category] ?? 'bg-gray-100 text-gray-600';

  // Adjacent posts
  const idx = POSTS.indexOf(post);
  const prevPost = idx < POSTS.length - 1 ? POSTS[idx + 1] : null;
  const nextPost = idx > 0 ? POSTS[idx - 1] : null;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className={`relative overflow-hidden min-h-[340px] flex items-end bg-gradient-to-br ${gradient}`}>
        {post.dayNumber && (
          <div className="absolute inset-0 flex items-center justify-center select-none">
            <div className="text-[180px] font-black text-white/5 leading-none">{post.dayNumber}</div>
          </div>
        )}
        <div className="relative z-20 max-w-[800px] mx-auto px-8 max-md:px-6 py-14 w-full">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-white/60 text-[12px] font-medium hover:text-white transition-colors mb-6"
          >
            ← Back to Blog
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`inline-block text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded-full ${categoryColor}`}>
              {post.category}
            </span>
            {post.dayNumber && (
              <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#6FF2C1]">
                Day {post.dayNumber} / 88
              </span>
            )}
          </div>
          <h1 className="text-[28px] md:text-[40px] font-black text-white leading-[1.1] mb-4 max-w-[680px]">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-white/50 text-[12px]">
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readTime} read</span>
          </div>
        </div>
      </section>

      {/* ── Article Body ─────────────────────────────────────── */}
      <div className="max-w-[800px] mx-auto px-8 max-md:px-6 py-12">
        {/* Excerpt lead */}
        <p className="text-[17px] md:text-[18px] font-medium text-[#2A3044] leading-relaxed border-l-4 border-[#6FF2C1] pl-5 mb-10 bg-[#F8F9FC] py-4 pr-4 rounded-r-lg">
          {post.excerpt}
        </p>

        {/* Body blocks */}
        {blocks.length > 0 ? (
          <BlockRenderer blocks={blocks} />
        ) : (
          <p className="text-[15px] text-[#6B7280] italic">Full article content coming soon.</p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-[#D4D9E0]">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-medium text-[#6B7280] bg-[#F8F9FC] border border-[#D4D9E0] px-3 py-1 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* ── Next / Prev ───────────────────────────────────────── */}
      {(prevPost || nextPost) && (
        <div className="border-t border-[#D4D9E0] bg-[#F8F9FC]">
          <div className="max-w-[800px] mx-auto px-8 max-md:px-6 py-10 grid md:grid-cols-2 gap-6">
            {prevPost && (
              <Link href={`/blog/${prevPost.slug}`} className="group flex flex-col gap-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#6B7280]">← Older post</span>
                <span className="text-[14px] font-semibold text-[#04102D] group-hover:text-[#287BE8] transition-colors leading-snug">
                  {prevPost.title}
                </span>
              </Link>
            )}
            {nextPost && (
              <Link href={`/blog/${nextPost.slug}`} className="group flex flex-col gap-1 md:text-right md:ml-auto">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#6B7280]">Newer post →</span>
                <span className="text-[14px] font-semibold text-[#04102D] group-hover:text-[#287BE8] transition-colors leading-snug">
                  {nextPost.title}
                </span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="bg-[#04102D] py-14">
        <div className="max-w-[640px] mx-auto px-8 max-md:px-6 text-center">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#6FF2C1] mb-3">
            Let's Work Together
          </p>
          <h2 className="text-[26px] font-black text-white mb-4 leading-snug">
            Ready to put AI to work in your business?
          </h2>
          <p className="text-white/60 text-[14px] mb-8 leading-relaxed">
            Book a call and walk away with a clear view of where AI creates the most leverage for your specific situation.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/#contact"
              className="inline-block bg-[#287BE8] text-white text-[13px] font-bold px-8 py-3 rounded-lg hover:bg-[#1a6ad4] transition-colors"
            >
              Book a Call →
            </Link>
            <Link
              href="/blog"
              className="inline-block border border-white/30 text-white text-[13px] font-semibold px-8 py-3 rounded-lg hover:border-white/60 transition-colors"
            >
              More Posts
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
