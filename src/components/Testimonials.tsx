'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      quote: 'Dave brings energy and real-world AI insights that inspire our students to think differently about their futures.',
      name: 'Dr. Brooks Holtom',
      role: 'Professor of Management, Georgetown',
    },
    {
      quote: 'His Edge8 branding and AI strategy transformed how we approach technology. Game-changing work.',
      name: 'Dan Absher',
      role: 'CEO, Absher Construction Company',
    },
    {
      quote: 'Dave understands brand strategy better than anyone. His vision is clear and actionable.',
      name: 'Dao Nguyen',
      role: 'Founder, DN Legal',
    },
    {
      quote: 'His AI Summit keynote shifted how we think about organizational transformation. Brilliant speaker.',
      name: 'Dato George Lim',
      role: 'Founder CEO, G&A GROUP',
    },
    {
      quote: "Dave's work with our AI forum has been invaluable. He brings depth and accessibility to complex topics.",
      name: 'John VanNewkirk',
      role: 'YPO Gold Seattle',
    },
  ];

  const visibleTestimonials = [
    testimonials[currentIndex],
    testimonials[(currentIndex + 1) % testimonials.length],
  ];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-[880px] mx-auto px-8 sm:px-10">
        {/* Section Label */}
        <div className="text-[#287BE8] text-[10px] font-bold tracking-[0.12em] uppercase mb-4">
          Testimonials
        </div>

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-[#04102D] mb-12">
          Here's what they say about Dave
        </h2>

        {/* Testimonial Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {visibleTestimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-[#EAEEF2] border-l-4 border-[#287BE8] p-6 rounded-sm"
            >
              <p className="text-[#2A3044] mb-4 leading-relaxed">
                "{testimonial.quote}"
              </p>
              <div>
                <p className="font-bold text-[#04102D]">{testimonial.name}</p>
                <p className="text-sm text-[#6B7280]">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handlePrev}
            className="p-2 rounded-md border border-[#D4D9E0] hover:bg-[#EAEEF2] transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={20} className="text-[#04102D]" />
          </button>
          <div className="flex gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-[#287BE8]' : 'bg-[#D4D9E0]'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
          <button
            onClick={handleNext}
            className="p-2 rounded-md border border-[#D4D9E0] hover:bg-[#EAEEF2] transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight size={20} className="text-[#04102D]" />
          </button>
        </div>
      </div>
    </section>
  );
}
