'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navLinks = [
    { label: 'Blog', href: '/blog' },
    { label: 'Keynotes', href: '/speaker-topics' },
    { label: 'Consultation', href: '/ai-in-business' },
    { label: 'Books', href: '/books' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-sm border-b border-[#E8ECF2]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-[1080px] mx-auto px-8 sm:px-5 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link
          href="/"
          className={`font-bold text-[17px] tracking-tight transition-colors ${
            scrolled ? 'text-[#04102D]' : 'text-white'
          }`}
        >
          Dave Hajdu
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[13px] font-medium transition-colors hover:opacity-100 ${
                scrolled
                  ? 'text-[#04102D] opacity-70 hover:text-[#287BE8]'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <Link
          href="/speaker-topics"
          className="hidden md:inline-block bg-[#6FF2C1] text-[#04102D] px-5 py-2.5 rounded-[6px] text-[11px] font-bold tracking-[0.07em] uppercase hover:bg-[#5de8b3] transition-colors"
        >
          Book a Keynote
        </Link>

        {/* Mobile menu button */}
        <button
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <X size={22} className={scrolled ? 'text-[#04102D]' : 'text-white'} />
          ) : (
            <Menu size={22} className={scrolled ? 'text-[#04102D]' : 'text-white'} />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-[#E8ECF2] px-8 py-5">
          <div className="flex flex-col gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-[#04102D] font-medium hover:text-[#287BE8] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/speaker-topics"
              className="bg-[#6FF2C1] text-[#04102D] px-5 py-3 rounded-md text-xs font-bold tracking-[0.07em] uppercase text-center"
              onClick={() => setIsOpen(false)}
            >
              Book a Keynote
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
