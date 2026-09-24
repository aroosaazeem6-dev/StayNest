function ExploreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" strokeLinecap="round" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4M17 3v4M3 10h18" strokeLinecap="round" />
      <path d="M7 14h3M7 18h6" strokeLinecap="round" />
    </svg>
  );
}

function EnjoyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
      <path d="M20.8 8.8c0 5.5-8.8 10.2-8.8 10.2S3.2 14.3 3.2 8.8A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z" />
      <circle cx="12" cy="10.5" r="1.8" fill="currentColor" />
    </svg>
  );
}

interface Step {
  number: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    number: '01',
    label: 'Explore',
    description: 'Find a stay that fits your needs, from apartments to villas.',
    icon: <ExploreIcon />,
  },
  {
    number: '02',
    label: 'Book',
    description: 'Choose your dates and complete your booking with confidence.',
    icon: <BookIcon />,
  },
  {
    number: '03',
    label: 'Enjoy',
    description: 'Stay somewhere that feels like home and travel on your terms.',
    icon: <EnjoyIcon />,
  },
];

export function HowItWorks() {
  return (
    <section className="container-section py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-forest-900 sm:text-4xl">
          How it works
        </h2>
        <p className="mt-3 text-sage-500">
          Booking your next stay on StayNest is simple in three steps.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.number} className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-50 text-sage-600">
              {step.icon}
            </div>
            <div className="mt-5">
              <span className="text-sm font-semibold uppercase tracking-wider text-sage-400">
                Step {step.number}
              </span>
              <h3 className="mt-2 text-xl font-semibold text-forest-900">{step.label}</h3>
              <p className="mt-3 text-sm leading-6 text-sage-500">{step.description}</p>
            </div>
            {step.number !== '03' && (
              <div className="mt-6 hidden sm:block">
                <div className="mx-auto h-px w-10 bg-sage-200" />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default HowItWorks;
