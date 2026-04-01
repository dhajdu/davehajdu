import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      {/* Main Footer Content */}
      <div className="border-t border-[#D4D9E0] py-12">
        <div className="max-w-[880px] mx-auto px-8 max-md:px-5 text-center">
          <p className="italic text-[#6B7280] mb-4">
            Problem first. AI second. ROI always.
          </p>
          <h3 className="font-bold text-[#04102D] text-lg mb-2">Dave Hajdu</h3>
          <p className="text-sm text-[#6B7280] mb-6">
            Copyright {currentYear}. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center justify-center gap-6">
            <Link
              href="https://linkedin.com/in/davehajdu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6B7280] hover:text-[#287BE8] transition-colors text-sm"
              aria-label="LinkedIn"
            >
              LinkedIn
            </Link>
            <Link
              href="https://twitter.com/davehajdu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6B7280] hover:text-[#287BE8] transition-colors text-sm"
              aria-label="X / Twitter"
            >
              X / Twitter
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Navy Section */}
      <div className="bg-[#04102D] text-white py-6">
        <div className="max-w-[880px] mx-auto px-8 max-md:px-5 text-center text-sm">
          <p>Building the future of business with AI</p>
        </div>
      </div>
    </footer>
  );
}
