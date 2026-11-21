import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { listPosts, getPost } from '@/lib/blog/posts';
import { parseBody, type Block } from '@/lib/blog/body';
import PostVideo from './PostVideo';

type Props = { params: Promise<{ slug: string }> };

// Static, refreshed hourly until publishing revalidates on demand (marketing phase 2).
export const revalidate = 3600;

export async function generateStaticParams() {
  return (await listPosts()).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  const ogShare = post.ogImage ?? post.image;
  const ogImage = ogShare ? [ogShare] : undefined;
  const seoTitleBase = post.titleTag || post.title;
  const description = post.metaDescription || post.excerpt;
  return {
    title: `${seoTitleBase} | Dave Hajdu`,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url: `/blog/${post.slug}`,
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: ogImage,
    },
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  'High Performance Culture': 'bg-[#287BE8]/15 text-[#287BE8]',
  'AI In Business': 'bg-[#D1458B]/15 text-[#D1458B]',
  'Branding with AI': 'bg-purple-100 text-purple-700',
  'One Person Company': 'bg-[#1A9E74]/15 text-[#1A9E74]',
};

// Posts in a series get a "the series" card at the end, oldest first.
const SERIES = new Set(['One Person Company']);

// Wide blocks break out of the reading column on large screens.
const WIDE = 'lg:-mx-28';

function H({ html }: { html?: string }) {
  return <span dangerouslySetInnerHTML={{ __html: html ?? '' }} />;
}

function Caption({ text }: { text?: string }) {
  if (!text) return null;
  return <figcaption className="text-[13px] leading-snug text-[#6B7280] mt-3 text-center max-w-[560px] mx-auto">{text}</figcaption>;
}

function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="prose-custom">
      {blocks.map((block, i) => {
        switch (block.tag) {
          case 'h1':
          case 'h2':
            return (
              <h2
                key={i}
                className="text-[26px] md:text-[32px] font-black tracking-[-0.02em] text-[#04102D] mt-16 mb-5 leading-[1.15] before:block before:w-10 before:h-[5px] before:rounded-full before:bg-[#6FF2C1] before:mb-5"
              >
                <H html={block.text} />
              </h2>
            );
          case 'h3':
            return (
              <h3 key={i} className="text-[20px] md:text-[22px] font-bold text-[#04102D] mt-10 mb-3 leading-snug">
                <H html={block.text} />
              </h3>
            );
          case 'h4':
          case 'h5':
            return (
              <h4 key={i} className="text-[13px] font-bold text-[#04102D] mt-8 mb-2 uppercase tracking-[0.12em]">
                <H html={block.text} />
              </h4>
            );
          case 'blockquote':
            return (
              <blockquote
                key={i}
                className="my-10 border-l-4 border-[#6FF2C1] pl-6 text-[21px] md:text-[24px] font-semibold leading-snug text-[#04102D]"
              >
                <H html={block.text} />
              </blockquote>
            );
          case 'li':
            return (
              <ul key={i} className="my-6 space-y-3">
                {(block.text ?? '').split(/\n-\s+/).map((item, j) => (
                  <li key={j} className="flex gap-3.5 text-[17px] md:text-[18px] text-[#2A3044] leading-[1.7]">
                    <span className="w-2 h-2 rounded-full bg-[#287BE8] flex-shrink-0 mt-[11px]" />
                    <span>
                      <H html={item} />
                    </span>
                  </li>
                ))}
              </ul>
            );
          case 'video':
          case 'widevideo':
            return (
              <figure key={i} className={`my-12 not-prose ${WIDE}`}>
                <div className="overflow-hidden rounded-2xl bg-[#04102D] shadow-[0_24px_60px_-24px_rgba(4,16,45,0.45)]">
                  <PostVideo src={block.images?.[0]} poster={block.images?.[1]} wide={block.tag === 'widevideo'} />
                </div>
                <Caption text={block.caption} />
              </figure>
            );
          case 'screens':
            return (
              <figure key={i} className={`my-12 not-prose ${WIDE}`}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {(block.images ?? []).map((src, j) => (
                    <div key={j} className="relative aspect-[9/16] overflow-hidden rounded-xl border border-[#E8ECF2] shadow-sm">
                      <Image src={src} alt={`${block.caption ?? 'Screen'} ${j + 1}`} fill sizes="(min-width: 1024px) 300px, 50vw" className="object-cover" />
                    </div>
                  ))}
                </div>
                <Caption text={block.caption} />
              </figure>
            );
          case 'figure':
            return (
              <figure key={i} className={`my-12 not-prose ${WIDE}`}>
                {(block.images ?? []).map((src, j) => (
                  <Image
                    key={j}
                    src={src}
                    alt={block.caption ?? 'Figure'}
                    width={1800}
                    height={1770}
                    sizes="(min-width: 1024px) 900px, 100vw"
                    className="w-full h-auto rounded-2xl border border-[#E8ECF2] shadow-[0_16px_40px_-24px_rgba(4,16,45,0.35)]"
                  />
                ))}
                <Caption text={block.caption} />
              </figure>
            );
          case 'gallery':
            return (
              <figure key={i} className={`my-12 not-prose ${WIDE}`}>
                <div className="grid sm:grid-cols-2 gap-4">
                  {(block.images ?? []).map((src, j) => (
                    <div key={j} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#F0F2F5] shadow-sm">
                      <Image
                        src={src}
                        alt={`${block.caption ?? 'Photo'} ${j + 1}`}
                        fill
                        sizes="(min-width: 1024px) 450px, 100vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
                <Caption text={block.caption} />
              </figure>
            );
          case 'table':
            return (
              <div
                key={i}
                className="blog-table my-10 overflow-x-auto rounded-2xl border border-[#EAEEF2]"
                dangerouslySetInnerHTML={{ __html: block.text ?? '' }}
              />
            );
          case 'p':
          default:
            return (
              <p key={i} className="text-[17px] md:text-[18px] text-[#2A3044] leading-[1.75] my-6">
                <H html={block.text} />
              </p>
            );
        }
      })}
    </div>
  );
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  let blocks = parseBody(post.bodyMd);
  // The first video near the top becomes the feature, shown big under the title.
  const fi = blocks.findIndex((b, i) => i < 6 && (b.tag === 'video' || b.tag === 'widevideo'));
  const feature = fi >= 0 ? blocks[fi] : null;
  if (feature) blocks = blocks.filter((_, i) => i !== fi);

  const faqs = post.faqs;
  const categoryColor = CATEGORY_COLORS[post.category] ?? 'bg-white/10 text-white';

  // Adjacent posts
  const posts = await listPosts();
  const idx = posts.findIndex((p) => p.slug === slug);
  const prevPost = idx < posts.length - 1 ? posts[idx + 1] : null;
  const nextPost = idx > 0 ? posts[idx - 1] : null;
  const series = SERIES.has(post.category) ? posts.filter((p) => p.category === post.category).reverse() : [];

  return (
    <>
      {faqs && faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: f.a,
                },
              })),
            }),
          }}
        />
      )}
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#04102D]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_60%_at_12%_0%,rgba(40,123,232,0.35),transparent_70%),radial-gradient(40%_50%_at_92%_10%,rgba(111,242,193,0.16),transparent_70%)]"
        />
        <div className={`relative max-w-[900px] mx-auto px-6 md:px-8 pt-24 md:pt-28 text-center ${feature ? 'pb-10 md:pb-14' : 'pb-16 md:pb-20'}`}>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-white/55 text-[12px] font-medium hover:text-white transition-colors mb-8"
          >
            ← All posts
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <span className={`inline-block text-[10px] font-bold tracking-[0.12em] uppercase px-3 py-1 rounded-full ${categoryColor}`}>
              {post.category}
            </span>
            {post.dayNumber && (
              <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#6FF2C1]">
                Day {post.dayNumber} / 88
              </span>
            )}
          </div>
          <h1 className="text-[34px] md:text-[54px] font-black text-white leading-[1.05] tracking-[-0.025em] mb-6 max-w-[820px] mx-auto text-balance">
            {post.title}
          </h1>
          <p className="text-[17px] md:text-[20px] text-white/70 leading-relaxed max-w-[680px] mx-auto mb-8 text-pretty">
            {post.excerpt}
          </p>
          <div className="flex items-center justify-center gap-3 text-[13px] text-white/55">
            <Image
              src="/images/dave-speaking.webp"
              alt="Dave Hajdu"
              width={36}
              height={36}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-white/20"
            />
            <span className="font-semibold text-white/85">Dave Hajdu</span>
            <span aria-hidden>·</span>
            <span>{post.date}</span>
            <span aria-hidden>·</span>
            <span>{post.readTime} read</span>
          </div>
        </div>
        {feature && (
          <div className="relative px-4 md:px-8">
            {/* white lower half so the video sits across the edge of the hero */}
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-white" />
            <figure className="relative max-w-[1120px] mx-auto">
              <div className="overflow-hidden rounded-2xl md:rounded-3xl bg-black ring-1 ring-white/10 shadow-[0_40px_100px_-30px_rgba(4,16,45,0.7)]">
                <PostVideo src={feature.images?.[0]} poster={feature.images?.[1]} wide={feature.tag === 'widevideo'} />
              </div>
              <Caption text={feature.caption} />
            </figure>
          </div>
        )}
      </section>

      {/* ── Article Body ─────────────────────────────────────── */}
      <article className="px-6 md:px-8 pt-8 md:pt-12 pb-16">
        <div className="max-w-[680px] mx-auto">
          {blocks.length > 0 ? (
            <BlockRenderer blocks={blocks} />
          ) : (
            <p className="text-[15px] text-[#6B7280] italic">Full article content coming soon.</p>
          )}

          {/* Series */}
          {series.length > 1 && (
            <nav className={`mt-16 rounded-3xl bg-[#04102D] p-6 md:p-8 ${WIDE}`} aria-label={post.category}>
              <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#6FF2C1] mb-5">The series · {post.category}</p>
              <ol className="grid sm:grid-cols-2 gap-3">
                {series.map((p, i) => {
                  const m = p.title.match(/^Day (\d+):\s*(.*)$/);
                  const current = p.slug === post.slug;
                  return (
                    <li key={p.slug}>
                      <Link
                        href={`/blog/${p.slug}`}
                        aria-current={current ? 'page' : undefined}
                        className={`flex h-full items-start gap-4 rounded-2xl p-4 transition-colors ${current ? 'bg-white text-[#04102D]' : 'bg-white/5 text-white hover:bg-white/10'}`}
                      >
                        <span className={`text-[28px] font-black leading-none ${current ? 'text-[#1A9E74]' : 'text-[#6FF2C1]'}`}>
                          {m ? m[1] : i + 1}
                        </span>
                        <span className="text-[14px] font-semibold leading-snug pt-1">
                          {m ? m[2] : p.title}
                          {current && <span className="block text-[11px] font-medium text-[#6B7280] mt-1">You&apos;re reading this one</span>}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-[#E8ECF2]">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-medium text-[#6B7280] bg-[#F8F9FC] border border-[#E8ECF2] px-3 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
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
