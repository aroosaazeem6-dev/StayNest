import Link from 'next/link';
import { Property } from '@/lib/property-service';

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const imageUrl =
    property.images && property.images.length > 0
      ? property.images[0].url
      : null;

  const location = [property.city, property.country]
    .filter(Boolean)
    .join(', ') || 'Location TBA';

  const amenityNames = property.amenities
    ? property.amenities.slice(0, 3).map((a) => a.name)
    : [];

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-[4/3] bg-gray-200">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={property.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
            StayNest
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-base font-semibold text-gray-900">
            {property.title}
          </h3>
          <span className="shrink-0 text-sm font-semibold text-gray-900">
            ${property.pricePerNight}
            <span className="font-normal text-gray-500"> / night</span>
          </span>
        </div>

        <p className="mt-1 truncate text-sm text-gray-500">{location}</p>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
          <span className="rounded-md bg-gray-100 px-2 py-1">
            {property.propertyType}
          </span>
          <span>Up to {property.maxGuests} guests</span>
          {property.bedrooms !== null && (
            <span>{property.bedrooms} bed</span>
          )}
        </div>

        {amenityNames.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {amenityNames.map((name) => (
              <span
                key={name}
                className="rounded-md bg-brand-50 px-2 py-1 text-xs text-brand-700"
              >
                {name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4">
          <Link
            href={`/properties/${property.id}`}
            className="btn-primary w-full"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}

export default PropertyCard;