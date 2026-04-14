import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#020C1E]">
      <div className="max-w-[1080px] mx-auto px-8 sm:px-10 py-10 flex flex-col md:flex-row items-center justify-between gap-6">

        {/* Wordmark */}
        <span className="text-white/35 text-[13px] font-semibold tracking-tight">
          Dave Hajdu
        </span>

        {/* Nav */}
        <div className="flex items-center gap-8">
          {['Blog', 'Keynotes', 'Consultation', 'Books'].map((link) => (
            <Link
              key={link}
              href={`/${link.toLowerCase()}`}
              className="text-white/30 text-[12px] font-medium hover:text-white/60 transition-colors"
            >
              {link}
            </Link>
          ))}
        </div>

        {/* Social + copyright */}
        <div className="flex items-center gap-5">
          <Link
            href="https://linkedin.com/in/davehajdu"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/25 text-[12px] hover:text-white/50 transition-colors"
          >
            LinkedIn
          </Link>
          <span className="text-white/15 text-[12px]">© {currentYear} Dave Hajdu</span>
        </div>

      </div>
    </footer>
  );
}
