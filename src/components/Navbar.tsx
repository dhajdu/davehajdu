'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { label: 'AI in Business', href: '/ai-in-business', external: false },
    { label: 'Speaker Topics', href: '/speaker-topics', external: false },
    { label: 'Blog', href: '/blog', external: false },
    { label: 'Community', href: 'https://www.ai-officer.com/', external: true },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white backdrop-blur-sm border-b border-[#D4D9E0]">
      <div className="max-w-[880px] mx-auto px-8 sm:px-5 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-bold text-[#04102D] text-lg">
          DAVE HAJDU
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-[#2A3044] hover:text-[#287BE8] transition-colors"
              {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Button */}
        <button className="hidden md:block bg-[#04102D] text-white px-4 py-2 rounded-md text-xs font-bold tracking-[0.05em] uppercase hover:bg-[#0a1844] transition-colors">
          Book Dave
        </button>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <X size={24} className="text-[#04102D]" />
          ) : (
            <Menu size={24} className="text-[#04102D]" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-[#D4D9E0] px-8 py-4">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-[#2A3044] hover:text-[#287BE8] transition-colors"
                onClick={() => setIsOpen(false)}
                {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {link.label}
              </Link>
            ))}
            <button className="bg-[#04102D] text-white px-4 py-2 rounded-md text-xs font-bold tracking-[0.05em] uppercase hover:bg-[#0a1844] transition-colors w-full">
              Book Dave
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
