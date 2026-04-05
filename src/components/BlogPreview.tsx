import Link from 'next/link';
import { POSTS } from '@/lib/posts-data';

const posts = POSTS.slice(0, 3).map((p) => ({
  date: p.date,
  tag: p.category,
  title: p.title,
  excerpt: p.excerpt,
  slug: p.slug,
}));

export default function BlogPreview() {
  return (
    <section className="bg-white py-24 md:py-32">
      <div className="max-w-[1080px] mx-auto px-8 sm:px-5">

        {/* Header row */}
        <div className="flex items-end justify-between mb-16">
          <div>
            <div className="text-[#287BE8] text-[11px] font-bold tracking-[0.13em] uppercase mb-4">
              Latest Thinking
            </div>
            <h2
              className="text-[#04102D] font-black tracking-tight leading-[1.1]"
              style={{ fontSize: 'clamp(26px, 3vw, 38px)' }}
            >
              Ideas worth
              <br />
              <span className="text-[#287BE8]">acting on.</span>
            </h2>
          </div>
          <Link
            href="/blog"
            className="text-[#04102D]/50 text-[12px] font-bold tracking-[0.07em] uppercase flex items-center gap-2 hover:text-[#287BE8] transition-colors"
          >
            All Posts
            <span className="text-base">→</span>
          </Link>
        </div>

        {/* Post list */}
        <div className="flex flex-col">
          {posts.map((post, i) => (
            <Link
              key={i}
              href={`/blog/${post.slug}`}
              className="grid md:grid-cols-[120px_1fr_auto] gap-6 md:gap-10 items-center py-7 border-t border-[#EBF0F8] last:border-b group no-underline hover:no-underline"
              style={{ textDecoration: 'none' }}
            >
              {/* Date + tag */}
              <div>
                <div className="text-[#04102D]/40 text-[12px] font-medium mb-2">
                  {post.date}
                </div>
                <div className="bg-[#EBF0F8] text-[#04102D] text-[10px] font-bold tracking-[0.08em] uppercase px-2 py-1 rounded inline-block">
                  {post.tag}
                </div>
              </div>

              {/* Title + excerpt */}
              <div>
                <div className="text-[#04102D] text-[17px] font-bold tracking-tight leading-[1.3] mb-1.5 group-hover:text-[#287BE8] transition-colors">
                  {post.title}
                </div>
                <div className="text-[#04102D]/45 text-[14px] leading-[1.5]">
                  {post.excerpt}
                </div>
              </div>

              {/* Arrow */}
              <span className="text-[#04102D]/30 text-xl group-hover:text-[#287BE8] transition-colors">→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
