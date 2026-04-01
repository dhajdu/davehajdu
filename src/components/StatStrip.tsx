export default function StatStrip() {
  const stats = [
    {
      number: '25+',
      label: 'Years Experience',
    },
    {
      number: '5+',
      label: 'Companies Founded',
    },
    {
      number: '15+',
      label: 'Countries Spoken In',
    },
  ];

  return (
    <div className="border-t border-b border-[#D4D9E0]">
      <div className="max-w-[880px] mx-auto px-8 sm:px-5 py-12">
        <div className="grid grid-cols-3 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#04102D] mb-2">
                {stat.number}
              </div>
              <div className="text-sm text-[#6B7280]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
