export default function StatStrip() {
  const stats = [
    {
      number: '$9.5M',
      label: 'Raised, led by Baseline Ventures',
    },
    {
      number: '5+',
      label: 'Companies Founded',
    },
    {
      number: '15+',
      label: 'Countries Spoken In',
    },
    {
      number: '500+',
      label: 'Leaders Trained in AI',
    },
  ];

  return (
    <div className="border-t border-b border-[#D4D9E0]">
      <div className="max-w-[1000px] mx-auto px-8 sm:px-5 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-black text-[#04102D] mb-2 tracking-tight">
                {stat.number}
              </div>
              <div className="text-[12px] text-[#6B7280] leading-snug">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
