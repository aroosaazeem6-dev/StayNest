function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function FeatureSection() {
  return (
    <section className="container-section py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-forest-900 sm:text-4xl">
          Why StayNest
        </h2>
        <p className="mt-3 text-sage-500">
          We focus on what matters most — comfort, trust, and peace of mind.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
        <div className="rounded-2xl border border-sage-200/50 bg-white p-8 shadow-[0_1px_3px_rgba(38,51,45,0.06)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-50 text-sage-600">
            <CheckIcon />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-forest-900">Trusted stays</h3>
          <p className="mt-2 text-sm leading-6 text-sage-500">
            Every property is reviewed and verified so you know exactly what to expect.
          </p>
        </div>

        <div className="rounded-2xl border border-sage-200/50 bg-white p-8 shadow-[0_1px_3px_rgba(38,51,45,0.06)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-50 text-sage-600">
            <CheckIcon />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-forest-900">Easy booking</h3>
          <p className="mt-2 text-sm leading-6 text-sage-500">
            Book in minutes with clear dates, transparent pricing, and instant confirmation.
          </p>
        </div>

        <div className="rounded-2xl border border-sage-200/50 bg-white p-8 shadow-[0_1px_3px_rgba(38,51,45,0.06)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-50 text-sage-600">
            <CheckIcon />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-forest-900">Secure payments</h3>
          <p className="mt-2 text-sm leading-6 text-sage-500">
            Your payments are protected end-to-end with industry-standard encryption.
          </p>
        </div>
      </div>
    </section>
  );
}

export default FeatureSection;
