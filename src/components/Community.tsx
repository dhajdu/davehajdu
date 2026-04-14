export default function Community() {
  const features = [
    {
      title: 'Online & Offline Training',
      description: 'Join self-paced courses and weekly webinars designed for modern leaders.',
    },
    {
      title: 'Grow Together: AI Community',
      description: 'Connect with a global community of AI leaders and entrepreneurs.',
    },
    {
      title: 'Orchestrate AI Resources',
      description: 'Learn how to orchestrate AI resources effectively across your organization.',
    },
    {
      title: 'Drive Business Growth',
      description: 'Explore the Four Offices of the Future and transform your business.',
    },
  ];

  return (
    <section id="community" className="py-16 md:py-24">
      <div className="max-w-[880px] mx-auto px-8 sm:px-10">
        {/* Section Label */}
        <div className="text-[#287BE8] text-[10px] font-bold tracking-[0.12em] uppercase mb-4">
          Join the AI Officer's Community
        </div>

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-[#04102D] mb-12">
          Shaping the Future of Work Together
        </h2>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {features.map((feature, index) => (
            <div key={index} className="border border-[#D4D9E0] rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-[#04102D] mb-2 text-base">
                {feature.title}
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <button className="bg-[#6FF2C1] text-[#04102D] px-6 py-3 rounded-md text-xs font-bold tracking-[0.05em] uppercase hover:bg-[#5de8b3] transition-colors">
            Join Me Today
          </button>
        </div>
      </div>
    </section>
  );
}
