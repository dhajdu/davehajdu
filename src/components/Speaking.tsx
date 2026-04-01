import { Check } from 'lucide-react';

export default function Speaking() {
  const points = [
    'Proven growth frameworks',
    'Real-world case studies',
    'Hands-on demos that stick',
  ];

  return (
    <section id="speaking" className="bg-[#04102D] py-16 md:py-24 w-full">
      <div className="max-w-[880px] mx-auto px-8 sm:px-5">
        {/* Section Label */}
        <div className="text-[#287BE8] text-[10px] font-bold tracking-[0.12em] uppercase mb-4">
          Invite Dave to Speak
        </div>

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
          Build a Future-Ready Business with AI That Delivers
        </h2>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 gap-12 mb-8">
          {/* Left: Bullet Points */}
          <div className="space-y-4">
            {points.map((point, index) => (
              <div key={index} className="flex items-start gap-3">
                <Check size={20} className="text-[#6FF2C1] flex-shrink-0 mt-0.5" />
                <span className="text-white text-base">{point}</span>
              </div>
            ))}

            <p className="text-white opacity-75 text-sm pt-4">
              95% of attendees report actionable insights they can implement immediately.
            </p>

            <button className="bg-[#6FF2C1] text-[#04102D] px-6 py-3 rounded-md text-xs font-bold tracking-[0.05em] uppercase hover:bg-[#5de8b3] transition-colors">
              Check Out Speaking Topics
            </button>
          </div>

          {/* Right: Stat */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-6xl md:text-7xl font-bold text-[#6FF2C1] mb-2">
              95%
            </div>
            <p className="text-white text-center">
              of attendees report actionable insights
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
