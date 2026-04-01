import Image from 'next/image';

export default function About() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-[880px] mx-auto px-8 sm:px-5">
        {/* Section Label */}
        <div className="text-[#287BE8] text-[10px] font-bold tracking-[0.12em] uppercase mb-4">
          About
        </div>

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-[#04102D] mb-8">
          From Seattle to Saigon: A Founder's Journey
        </h2>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Text Content */}
          <div className="space-y-6">
            <p className="text-base text-[#2A3044] leading-relaxed">
              With over 25 years of experience, Dave Hajdu has been at the forefront of business transformation since the early days of machine learning and relational database design. His career took off in the 90s at Microsoft, and he's since worked with diverse companies, from hyper-growth startups like Stitch Fix to industry giants like Sands Casino in Macau.
            </p>

            <p className="text-base text-[#2A3044] leading-relaxed">
              Dave's entrepreneurial path spans founding Vinasource, an outsourcing firm, successfully building and exiting TINYpulse, a Silicon Valley-backed startup, and now leading Edge8 AI and the AI Officer Institute.
            </p>

            <p className="text-base text-[#2A3044] leading-relaxed">
              In 2016, he founded the Vietnam chapter of the Entrepreneur's Organization, fondly known as EO. Today, as an Area Director for Southeast Asia, Dave empowers entrepreneurs globally by helping EO Presidents grow their chapters.
            </p>

            <button className="bg-[#04102D] text-white px-6 py-3 rounded-md text-xs font-bold tracking-[0.05em] uppercase hover:bg-[#0a1844] transition-colors">
              Get in Touch
            </button>
          </div>

          {/* Image */}
          <div className="relative h-96 md:h-full rounded-lg overflow-hidden bg-[#EAEEF2]">
            <Image
              src="/images/dave-profile.jpg"
              alt="Dave Hajdu"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
