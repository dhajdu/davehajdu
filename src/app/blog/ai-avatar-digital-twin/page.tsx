import Link from 'next/link';
import Image from 'next/image';

export default function AIAvatarDigitalTwin() {
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
        Your AI Avatar Is Your Digital Twin
      </h1>

      <div className="flex items-center gap-3 text-sm text-[#6B7280] mb-8">
        <span>David Hajdu</span>
        <span>-</span>
        <span>Nov 6, 2025</span>
        <span>-</span>
        <span>2 min read</span>
      </div>

      <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden mb-12 bg-[#EAEEF2]">
        <Image
          src="/images/blog-3.jpg"
          alt="AI Avatar Digital Twin"
          fill
          className="object-cover"
        />
      </div>

      <div className="prose max-w-none text-[#2A3044] space-y-6 text-[18px] leading-relaxed">
        <p>
          AI avatar quality starts with source setup. Clean lighting, steady framing, crisp audio. Your avatar mirrors input quality. Digital twin on your best day. Not just believable, magnetic.
        </p>

        <p className="italic bg-[#EAEEF2] border-l-[3px] border-[#287BE8] p-6 rounded-r-lg">
          Replace this content with your full blog post. Each post is a standalone React page that gets statically generated at build time.
        </p>
      </div>
    </article>
  );
}
