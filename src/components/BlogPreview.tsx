import Image from 'next/image';
import Link from 'next/link';

export default function BlogPreview() {
  const posts = [
    {
      title: 'Year of the Fire Horse 2026',
      excerpt: 'Exploring what 2026 means for entrepreneurs and AI innovation.',
      date: 'Feb 28, 2026',
      readTime: '5 min read',
      image: '/images/blog-1.jpg',
      slug: 'fire-horse-2026',
    },
    {
      title: '18 Entrepreneurial Learnings from a Founder',
      excerpt: 'Key insights from decades of building, failing, and succeeding.',
      date: 'Feb 2, 2026',
      readTime: '6 min read',
      image: '/images/blog-2.jpg',
      slug: 'entrepreneurial-learnings',
    },
    {
      title: 'Your AI Avatar Is Your Digital Twin',
      excerpt: 'Understanding the future of AI personalization and digital identity.',
      date: 'Nov 6, 2025',
      readTime: '2 min read',
      image: '/images/blog-3.jpg',
      slug: 'ai-avatar-digital-twin',
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-[880px] mx-auto px-8 max-md:px-5">
      {/* Section Label */}
      <div className="text-[#287BE8] text-[10px] font-bold tracking-[0.12em] uppercase mb-4">
        Confessions of a Tech-Forward Founder
      </div>

      {/* Heading */}
      <h2 className="text-[28px] md:text-[28px] font-bold text-[#04102D] mb-12 max-w-[600px]">
        Latest Insights
      </h2>

      {/* Blog Cards Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {posts.map((post, index) => (
          <Link
            key={index}
            href={`/blog/${post.slug}`}
            className="bg-[#EAEEF2] rounded-lg overflow-hidden hover:shadow-lg transition-shadow block group"
          >
            {/* Image */}
            <div className="relative h-40 w-full bg-gradient-to-br from-[#287BE8]/20 to-[#D1458B]/20 overflow-hidden">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="font-bold text-[#04102D] mb-2 text-base leading-snug">
                {post.title}
              </h3>
              <p className="text-sm text-[#6B7280] mb-4 leading-relaxed">
                {post.excerpt}
              </p>

              {/* Meta */}
              <div className="flex items-center gap-3 text-xs text-[#6B7280] border-t border-[#D4D9E0] pt-4">
                <span>{post.date}</span>
                <span>-</span>
                <span>{post.readTime}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      </div>
    </section>
  );
}
