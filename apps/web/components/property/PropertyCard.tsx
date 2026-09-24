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
    <article className="flex flex-col overflow-hidden rounded-2xl border border-[#DDE3DA] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
      <div className="relative aspect-[4/3] bg-[#E8E6DF]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={property.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[#6B756E]">
            StayNest
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-base font-semibold text-[#26332D]">
            {property.title}
          </h3>
          <span className="shrink-0 text-sm font-semibold text-[#26332D]">
            ${property.pricePerNight}
            <span className="font-normal text-[#6B756E]"> / night</span>
          </span>
        </div>

        <p className="mt-1 truncate text-sm text-[#6B756E]">{location}</p>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#6B756E]">
          <span className="rounded-md bg-[#EAF1E7] px-2 py-1 text-[#405546]">
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
                className="rounded-md bg-[#EAF1E7] px-2 py-1 text-xs text-[#405546]"
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