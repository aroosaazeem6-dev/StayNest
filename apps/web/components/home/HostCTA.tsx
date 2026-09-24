import Link from 'next/link';

export function HostCTA() {
  return (
    <section className="container-section py-16">
      <div className="overflow-hidden rounded-[28px] border border-sage-200/50 bg-white px-8 py-12 shadow-[0_4px_20px_rgba(38,51,45,0.05)] sm:px-12 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-forest-900 sm:text-4xl">
            Have a place worth sharing?
          </h2>
          <p className="mt-3 text-sage-500">
            Turn your property into a StayNest stay and welcome travelers from
            around the world. Public registration creates your guest account;
            you can enable hosting from your dashboard at any time.
          </p>

          <div className="mt-8">
            <Link
              href="/register"
              className="btn-primary inline-flex items-center justify-center"
            >
              Become a Host
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HostCTA;
