import Link from 'next/link';

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
      <path d="M5 12.5l5 5 9-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Hero() {
  return (
    <section className="bg-sage-50 py-16 sm:py-20 lg:py-24">
      <div className="container-section">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">
          {/* Left: Content */}
          <div className="flex flex-col gap-8">
            <div className="space-y-5">
              <p className="text-sm font-semibold tracking-[0.2em] uppercase text-sage-600">
                WELCOME TO STAYNEST
              </p>

              <h1 className="text-4xl font-bold tracking-tight text-forest-900 sm:text-5xl lg:text-6xl">
                Find Your Perfect Stay
              </h1>

              <p className="max-w-lg text-lg text-sage-600 leading-relaxed">
                Beautiful places, comfortable stays, and unforgettable journeys.
                Discover handpicked accommodations that match your style and
                create memories that last a lifetime.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/properties"
                className="btn-primary inline-flex items-center justify-center px-8 py-3 text-base"
              >
                Explore Stays
              </Link>
              <Link
                href="/register"
                className="btn-secondary inline-flex items-center justify-center px-8 py-3 text-base"
              >
                Become a Host
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 pt-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-600/10 text-sage-600">
                  <CheckIcon />
                </span>
                <span className="text-sm font-medium text-sage-700">
                  Unique Homes
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-600/10 text-sage-600">
                  <CheckIcon />
                </span>
                <span className="text-sm font-medium text-sage-700">
                  Top Locations
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-600/10 text-sage-600">
                  <CheckIcon />
                </span>
                <span className="text-sm font-medium text-sage-700">
                  Trusted Stays
                </span>
              </div>
            </div>
          </div>

          {/* Right: Property Image */}
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] shadow-[0_25px_60px_rgba(38,51,45,0.12)]">
              <img
                src="/images/hero-property.jpg"
                alt="Luxury vacation home"
                className="h-full w-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-900/30 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
