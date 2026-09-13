import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="container-section py-10">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="text-center sm:text-left">
            <span className="text-lg font-bold text-brand-600">StayNest</span>
            <p className="mt-1 text-sm text-gray-500">
              A full-stack vacation rental marketplace.
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
            <Link href="/properties" className="transition hover:text-brand-600">
              Properties
            </Link>
            <Link href="/login" className="transition hover:text-brand-600">
              Login
            </Link>
            <Link href="/register" className="transition hover:text-brand-600">
              Register
            </Link>
          </nav>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} StayNest. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;