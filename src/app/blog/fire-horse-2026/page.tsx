import Link from 'next/link';
import Image from 'next/image';

export default function FireHorse2026() {
  return (
    <article>
      {/* Back link */}
      <Link
        href="/blog"
        className="text-[#287BE8] text-sm hover:underline mb-8 inline-block"
      >
        Back to all posts
      </Link>

      {/* Header */}
      <div className="text-[#287BE8] text-[10px] font-bold tracking-[0.12em] uppercase mb-4">
        Confessions of a Tech-Forward Founder
      </div>

      <h1 className="text-[28px] md:text-[40px] font-bold text-[#04102D] mb-4 leading-tight max-w-[700px]">
        Year of the Fire Horse 2026: Week One Already Has Me By the Throat
      </h1>

      <div className="flex items-center gap-3 text-sm text-[#6B7280] mb-8">
        <span>David Hajdu</span>
        <span>-</span>
        <span>Feb 28, 2026</span>
        <span>-</span>
        <span>5 min read</span>
      </div>

      {/* Featured Image */}
      <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden mb-12 bg-[#EAEEF2]">
        <Image
          src="/images/blog-1.jpg"
          alt="Year of the Fire Horse 2026"
          fill
          className="object-cover"
        />
      </div>

      {/* Article Body - placeholder content for you to replace */}
      <div className="prose max-w-none text-[#2A3044] space-y-6 text-[18px] leading-relaxed">
        <p>
          The Year of the Fire Horse started on February 17th. By the end of the first week, I had already lived through a revenue high, the worst product failure of my career, and a perfect score in a leadership class. Three massive swings in seven days.
        </p>

        <p>
          My father is a Chinese astrologer. I grew up in this world. And apparently, this is exactly how the most volatile year in the 60-year cycle is supposed to go.
        </p>

        <p className="italic bg-[#EAEEF2] border-l-[3px] border-[#287BE8] p-6 rounded-r-lg">
          Replace this content with your full blog post. You can use standard HTML and Tailwind classes to style each post exactly how you want.
        </p>
      </div>
    </article>
  );
}
