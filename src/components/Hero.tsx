'use client';

import { useEffect, useRef } from 'react';

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={heroRef}
      className="reveal relative w-full bg-[#04102D] py-24 md:py-32 overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#287BE8] to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative max-w-[880px] mx-auto px-8 sm:px-5 text-center">
        {/* Section Label */}
        <div className="text-[#287BE8] text-[10px] font-bold tracking-[0.12em] uppercase mb-6">
          Personal Brand
        </div>

        {/* Headline */}
        <h1 className="text-white font-bold text-4xl md:text-[47px] leading-tight mb-6">
          Discover how AI will Unlock The Four Offices of the Future
        </h1>

        {/* Supporting Text */}
        <p className="text-white text-base md:text-lg mb-8 max-w-2xl mx-auto opacity-55">
          Transform your business with proven frameworks and real-world AI solutions that deliver measurable ROI.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="bg-[#6FF2C1] text-[#04102D] px-6 py-3 rounded-md text-xs font-bold tracking-[0.05em] uppercase hover:bg-[#5de8b3] transition-colors w-full sm:w-auto">
            Connect with Dave
          </button>
          <button className="border-2 border-white text-white px-6 py-3 rounded-md text-xs font-bold tracking-[0.05em] uppercase hover:bg-white hover:text-[#04102D] transition-colors w-full sm:w-auto">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}
