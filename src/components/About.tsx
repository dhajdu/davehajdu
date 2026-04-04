import Image from 'next/image';

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
              className="text-[#04102D] font-black tracking-tight leading-[1.1] mb-3"
              style={{ fontSize: 'clamp(28px, 3.5vw, 44px)' }}
            >
              Foster School of Business.
              <br />
              <span className="text-[#287BE8]">Information Systems.</span>
            </h2>
            <p className="text-[#04102D]/35 text-[12px] font-semibold tracking-[0.08em] uppercase mb-7">
              University of Washington
            </p>
            <p className="text-[#04102D]/55 text-[16px] leading-[1.75] mb-4 max-w-[420px]">
              Before "automation" was a word anyone used, Dave was moving data and money inside Microsoft. He didn't read that most AI problems are data problems — he learned it by living inside one of the world's most data-driven companies when that still meant something.
            </p>
            <p className="text-[#04102D]/55 text-[16px] leading-[1.75] mb-4 max-w-[420px]">
              He built CMS systems for colleges and small businesses before WordPress was a thought. Then founded Vinasource (USTA, NCAA, MTV, Microsoft) and co-founded TINYpulse — raising $9.5M led by Baseline Ventures, the #2 investor in the world at the time — before its acquisition by WebMD.
            </p>
            <p className="text-[#04102D]/55 text-[16px] leading-[1.75] mb-8 max-w-[420px]">
              He also coached nationally ranked tennis players. He knows what it takes to compete at the top — and he brings that same standard to every engagement. He founded EO Vietnam, served as SE Asia Area Director, and sits on EO's Global Tech Committee, overseeing the tools that run chapter management worldwide.
            </p>

            {/* Coaching photo */}
            <div className="relative rounded-xl overflow-hidden" style={{ height: 220 }}>
              <Image
                src="/images/dave-coaching.jpeg"
                alt="Dave coaching a client"
                fill
                className="object-cover"
                style={{ objectPosition: 'center 30%' }}
              />
              <div className="absolute inset-0 bg-[#04102D]/10" />
              <div className="absolute bottom-0 left-0 right-0 px-5 py-3"
                style={{ background: 'linear-gradient(to top, rgba(4,16,45,0.75) 0%, transparent 100%)' }}>
                <p className="text-white text-[12px] font-semibold tracking-wide">
                  Working with leaders to turn AI into results
                </p>
              </div>
            </div>
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
            <div className="mt-6 px-4">
              <p className="text-[#04102D] text-[20px] font-black tracking-tight leading-[1.2] text-center mb-2">
                "The CMS is dead.
                <br />
                <span className="text-[#287BE8]">AI is the shooter."</span>
              </p>
              <p className="text-[#04102D]/35 text-[11px] font-bold tracking-[0.1em] uppercase text-center">
                — Dave Hajdu
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
