import Link from 'next/link';

export function Hero() {
  return (
    <section className="bg-gradient-to-br from-brand-50 via-white to-brand-100">
      <div className="container-section flex flex-col items-center py-16 text-center sm:py-20">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
          Find your perfect stay
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-gray-600">
          Discover handpicked vacation rentals around the world — from cozy
          city apartments to secluded mountain cabins.
        </p>
        <div className="mt-8">
          <Link href="/properties" className="btn-primary">
            Explore stays
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Hero;