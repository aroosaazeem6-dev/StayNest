'use client';

import Link from 'next/link';
import { type Favorite } from '@/lib/favorite-service';

interface FavoriteCardProps {
  favorite: Favorite;
  onRemove: (propertyId: string) => void;
  removing: boolean;
}

export function FavoriteCard({ favorite, onRemove, removing }: FavoriteCardProps) {
  const { property } = favorite;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex aspect-[4/3] items-center justify-center bg-gray-100 text-sm text-gray-400">
        StayNest
      </div>
      <div className="p-4">
        <h3 className="truncate text-base font-semibold text-gray-900">
          {property.title}
        </h3>
        <p className="mt-1 truncate text-sm text-gray-500">
          {[property.city, property.country].filter(Boolean).join(', ') || 'Location TBA'}
        </p>
        <span className="mt-2 inline-block rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
          {property.propertyType}
        </span>
        <div className="mt-4 flex items-center gap-2">
          <Link
            href={`/properties/${property.id}`}
            className="btn-primary flex-1"
          >
            View stay
          </Link>
          <button
            onClick={() => onRemove(property.id)}
            disabled={removing}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            aria-label="Remove from favorites"
          >
            {removing ? '…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}