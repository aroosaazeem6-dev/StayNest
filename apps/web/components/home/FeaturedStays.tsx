export interface FeaturedStay {
  id: string;
  title: string;
  location: string;
  pricePerNight: number;
  rating: number;
  image: string;
}

/**
 * Static mock stays for UI presentation only.
 * NOT connected to the backend in this step.
 */
export const MOCK_FEATURED_STAYS: FeaturedStay[] = [
  {
    id: 'mock-1',
    title: 'Mountain View Cabin',
    location: 'Aspen, USA',
    pricePerNight: 250,
    rating: 4.9,
    image: '/images/mock/mountain-cabin.jpg',
  },
  {
    id: 'mock-2',
    title: 'Beachfront Bungalow',
    location: 'Miami, USA',
    pricePerNight: 320,
    rating: 4.8,
    image: '/images/mock/beach-bungalow.jpg',
  },
  {
    id: 'mock-3',
    title: 'Seaside Villa',
    location: 'Lisbon, Portugal',
    pricePerNight: 410,
    rating: 4.7,
    image: '/images/mock/seaside-villa.jpg',
  },
  {
    id: 'mock-4',
    title: 'Alpine Loft',
    location: 'Zermatt, Switzerland',
    pricePerNight: 380,
    rating: 4.9,
    image: '/images/mock/alpine-loft.jpg',
  },
];

export function FeaturedStays() {
  return (
    <section className="container-section py-14">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Featured stays
        </h2>
        <p className="mt-2 text-gray-600">
          A preview of some of our favorite places to stay.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {MOCK_FEATURED_STAYS.map((stay) => (
          <article
            key={stay.id}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <div className="aspect-[4/3] bg-gray-200">
              <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                {stay.image}
              </div>
            </div>
            <div className="p-4">
              <h3 className="truncate text-base font-semibold text-gray-900">
                {stay.title}
              </h3>
              <p className="truncate text-sm text-gray-500">{stay.location}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">
                  ${stay.pricePerNight}
                  <span className="font-normal text-gray-500"> / night</span>
                </span>
                <span className="text-sm font-medium text-brand-600">
                  {stay.rating} ★
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default FeaturedStays;