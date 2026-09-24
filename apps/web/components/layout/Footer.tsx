import Link from 'next/link';

function Logo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="m3 11 9-8 9 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-sage-200/50 bg-white">
      <div className="container-section py-10">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <Logo />
            <span className="text-lg font-bold text-forest-900">StayNest</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-sage-500">
            <Link
              href="/properties"
              className="transition-colors hover:text-forest-900"
            >
              Explore Stays
            </Link>
            <Link
              href="/register"
              className="transition-colors hover:text-forest-900"
            >
              Become a Host
            </Link>
            <Link
              href="/login"
              className="transition-colors hover:text-forest-900"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="transition-colors hover:text-forest-900"
            >
              Register
            </Link>
          </nav>
        </div>

        <div className="mt-6 border-t border-sage-200/50 pt-6 text-center text-xs text-sage-400">
          &copy; {new Date().getFullYear()} StayNest. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
