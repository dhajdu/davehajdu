import Link from 'next/link';
import Image from 'next/image';

const posts = [
  {
    title: 'Year of the Fire Horse 2026: Week One Already Has Me By the Throat',
    excerpt: 'The Year of the Fire Horse started on February 17th. By the end of the first week, I had already lived through a revenue high, the worst product failure of my career, and a perfect score in a leadership class.',
    date: 'Feb 28, 2026',
    readTime: '5 min read',
    slug: 'fire-horse-2026',
    image: '/images/blog-1.jpg',
  },
  {
    title: '18 Entrepreneurial Learnings from a Founder Who Built Businesses in the World\'s Toughest Markets',
    excerpt: 'I learned so much about the 50% of leadership that we all know matters - the human side. The relationships. The hard-won wisdom that only comes from building something real in difficult places.',
    date: 'Feb 2, 2026',
    readTime: '6 min read',
    slug: 'entrepreneurial-learnings',
    image: '/images/blog-2.jpg',
  },
  {
    title: 'Your AI Avatar Is Your Digital Twin',
    excerpt: 'AI avatar quality starts with source setup. Clean lighting, steady framing, crisp audio. Your avatar mirrors input quality. Digital twin on your best day.',
    date: 'Nov 6, 2025',
    readTime: '2 min read',
    slug: 'ai-avatar-digital-twin',
    image: '/images/blog-3.jpg',
  },
];

export default function BlogIndex() {
  return (
    <>
      {/* Section Label */}
      <div className="text-[#287BE8] text-[10px] font-bold tracking-[0.12em] uppercase mb-4">
        Confessions of a Tech-Forward Founder
      </div>

      <h1 className="text-[28px] font-bold text-[#04102D] mb-12 max-w-[600px]">
        All Posts
      </h1>

      <div className="grid md:grid-cols-3 gap-4">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group bg-[#EAEEF2] rounded-lg overflow-hidden hover:shadow-lg transition-shadow block"
          >
            <div className="relative h-40 w-full bg-gradient-to-br from-[#287BE8]/20 to-[#D1458B]/20 overflow-hidden">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6">
              <h3 className="font-bold text-[#04102D] mb-2 text-base leading-snug">
                {post.title}
              </h3>
              <p className="text-sm text-[#6B7280] mb-4 leading-relaxed">
                {post.excerpt}
              </p>
              <div className="flex items-center gap-3 text-xs text-[#6B7280] border-t border-[#D4D9E0] pt-4">
                <span>{post.date}</span>
                <span>-</span>
                <span>{post.readTime}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
