export default function About() {
  return (
    <section className="bg-white py-24 md:py-32">
      <div className="max-w-[1080px] mx-auto px-8 sm:px-5">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">

          {/* Left: The story */}
          <div>
            <div className="text-[#287BE8] text-[11px] font-bold tracking-[0.13em] uppercase mb-5">
              The Origin
            </div>
            <h2
              className="text-[#04102D] font-black tracking-tight leading-[1.1] mb-7"
              style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}
            >
              I graduated from
              <br />
              the business school.
              <br />
              <span className="text-[#287BE8]">In Information Systems.</span>
            </h2>
            <p className="text-[#04102D]/50 text-[17px] leading-[1.7] mb-5 max-w-[420px]">
              Half business strategy. Half computer science. In a world that loves
              to put people in a box, I was built to stand in the gap between the two.
            </p>
            <p className="text-[#04102D]/50 text-[17px] leading-[1.7] max-w-[420px]">
              That duality is exactly what organizations need right now — someone
              who speaks both languages and can translate AI from theory into
              measurable ROI.
            </p>
          </div>

          {/* Right: The 50/50 visual card */}
          <div>
            <div className="bg-[#04102D] rounded-2xl overflow-hidden grid grid-cols-2">
              {/* Business half */}
              <div className="p-10 md:p-12 border-r border-white/[0.07]">
                <div className="text-[#6FF2C1] text-5xl font-black tracking-tight leading-none mb-3">
                  50%
                </div>
                <div className="text-white text-[15px] font-bold mb-5">
                  Business
                </div>
                <div className="flex flex-col gap-2">
                  {['Strategy', 'Leadership', 'Communication', 'ROI thinking'].map((item) => (
                    <div key={item} className="text-white/40 text-[12px] font-medium tracking-wide">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech half */}
              <div className="p-10 md:p-12">
                <div className="text-[#287BE8] text-5xl font-black tracking-tight leading-none mb-3">
                  50%
                </div>
                <div className="text-white text-[15px] font-bold mb-5">
                  Computer Science
                </div>
                <div className="flex flex-col gap-2">
                  {['Systems thinking', 'Technical depth', 'AI architecture', 'Data fluency'].map((item) => (
                    <div key={item} className="text-white/40 text-[12px] font-medium tracking-wide">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pull quote */}
            <p className="text-[#04102D]/40 text-[14px] italic text-center mt-6 leading-relaxed px-4">
              "In the 50/50 era, the most valuable person in the room is not the
              one who knows AI — it's the one who knows how to lead with it."
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
