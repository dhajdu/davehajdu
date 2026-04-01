export default function Expertise() {
  const expertise = [
    {
      title: 'Automated AI Agents',
      description: 'Transform your business with AI-powered Agents',
    },
    {
      title: 'AI & Their Data Layers',
      description: 'Build strong foundations for AI applications',
    },
    {
      title: 'Business Development',
      description: 'Design and implement business processes',
    },
    {
      title: 'Leadership & Growth',
      description: 'Equip business leaders with tools and mindset',
    },
    {
      title: 'Goal Setting & Performance',
      description: 'Adopt proven goal-setting strategies',
    },
    {
      title: 'Technology Integration',
      description: 'Maximize efficiency by integrating technology',
    },
  ];

  return (
    <section id="expertise" className="py-16 md:py-24">
      <div className="max-w-[880px] mx-auto px-8 sm:px-5">
        {/* Section Label */}
        <div className="text-[#287BE8] text-[10px] font-bold tracking-[0.12em] uppercase mb-4">
          Expertise
        </div>

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-[#04102D] mb-12">
          Let's Talk
        </h2>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {expertise.map((item, index) => (
            <div key={index} className="border border-[#D4D9E0] rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              {/* Top Accent Bar */}
              <div className="h-1 bg-[#287BE8]"></div>

              {/* Content */}
              <div className="p-6">
                <h3 className="font-bold text-[#04102D] mb-2 text-base">
                  {item.title}
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
