const FEATURES = [
  {
    title: 'Trusted stays',
    description:
      'Every property is reviewed and verified so you know exactly what to expect.',
  },
  {
    title: 'Easy booking',
    description:
      'Book in minutes with clear dates, transparent pricing, and instant confirmation.',
  },
  {
    title: 'Secure payments',
    description:
      'Your payments are protected end-to-end with industry-standard encryption.',
  },
];

export function FeatureSection() {
  return (
    <section className="container-section py-14">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FeatureSection;