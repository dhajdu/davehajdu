import Link from 'next/link';
import Image from 'next/image';

export default function EntrepreneurialLearnings() {
  return (
    <article>
      <Link
        href="/blog"
        className="text-[#287BE8] text-sm hover:underline mb-8 inline-block"
      >
        Back to all posts
      </Link>

      <div className="text-[#287BE8] text-[10px] font-bold tracking-[0.12em] uppercase mb-4">
        Confessions of a Tech-Forward Founder
      </div>

      <h1 className="text-[28px] md:text-[40px] font-bold text-[#04102D] mb-4 leading-tight max-w-[700px]">
        18 Entrepreneurial Learnings from a Founder Who Built Businesses in the World's Toughest Markets
      </h1>

      <div className="flex items-center gap-3 text-sm text-[#6B7280] mb-8">
        <span>David Hajdu</span>
        <span>-</span>
        <span>Feb 2, 2026</span>
        <span>-</span>
        <span>6 min read</span>
      </div>

      <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden mb-12 bg-[#EAEEF2]">
        <Image
          src="/images/blog-2.jpg"
          alt="Entrepreneurial Learnings"
          fill
          className="object-cover"
        />
      </div>

      <div className="prose max-w-none text-[#2A3044] space-y-6 text-[18px] leading-relaxed">
        <p>
          I learned so much about the 50% of leadership that we all know matters - the human side. The relationships. The hard-won wisdom that only comes from building something real in difficult places.
        </p>

        <p className="italic bg-[#EAEEF2] border-l-[3px] border-[#287BE8] p-6 rounded-r-lg">
          Replace this content with your full blog post. Each blog page is a standalone static file you can customize with any layout or style.
        </p>
      </div>
    </article>
  );
}
