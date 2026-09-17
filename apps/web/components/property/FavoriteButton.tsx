'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserRole } from '@prisma/client';
import { favoriteService } from '@/lib/favorite-service';

interface FavoriteButtonProps {
  propertyId: string;
}

type FavoriteState = 'idle' | 'loading' | 'favorited' | 'not-favorited' | 'error';

/**
 * Favorite/heart toggle for a single property.
 *
 * - Authenticated GUEST: toggles favorite state via the backend and reflects
 *   the persisted state on every mount (so refresh is correct).
 * - Unauthenticated or non-GUEST user: no API call is made; instead the user
 *   is prompted to log in / sign up, matching the existing auth flow used by
 *   the BookingCard.
 * - Duplicate requests are blocked while an action is in flight.
 */
export function FavoriteButton({ propertyId }: FavoriteButtonProps) {
  const { isAuthenticated, isLoading: authLoading, user, tokens } = useAuth();

  const [state, setState] = useState<FavoriteState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canFavorite = !!user && user.role === UserRole.GUEST;

  // Load the persisted favorite state from the backend on mount.
  useEffect(() => {
    if (authLoading || !isAuthenticated || !tokens?.accessToken || !canFavorite) {
      return;
    }
    let mounted = true;
    setState('loading');
    setErrorMessage(null);
    favoriteService
      .isFavorited(propertyId, tokens.accessToken)
      .then((res) => {
        if (!mounted) return;
        setState(res.favorited ? 'favorited' : 'not-favorited');
      })
      .catch((err: unknown) => {
        const e = err as { status?: number; message?: string } | undefined;
        if (!mounted) return;
        if (e?.status === 401) {
          // Session invalid — treat as not favorited rather than erroring.
          setState('not-favorited');
          return;
        }
        setState('error');
        setErrorMessage(e?.message || 'Could not load favorite status.');
      });
    return () => {
      mounted = false;
    };
  }, [propertyId, authLoading, isAuthenticated, tokens, canFavorite]);

  async function toggleFavorite() {
    if (!tokens?.accessToken || !canFavorite) return;
    // Block duplicate requests while the action is in flight.
    if (state === 'loading') return;

    const wasFavorited = state === 'favorited';
    // Optimistic UI update.
    setState(wasFavorited ? 'not-favorited' : 'favorited');
    setErrorMessage(null);

    try {
      if (wasFavorited) {
        await favoriteService.remove(propertyId, tokens.accessToken);
      } else {
        await favoriteService.add(propertyId, tokens.accessToken);
      }
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string } | undefined;
      // Roll back the optimistic update on failure.
      setState(wasFavorited ? 'favorited' : 'not-favorited');
      if (e?.status === 409) {
        // Already (or no longer) in the requested state — reconcile with backend.
        try {
          const res = await favoriteService.isFavorited(propertyId, tokens.accessToken);
          setState(res.favorited ? 'favorited' : 'not-favorited');
        } catch {
          setErrorMessage('Could not sync favorite status.');
        }
        return;
      }
      setErrorMessage(e?.message || 'Could not update favorites. Please try again.');
    }
  }

  // Not authenticated: prompt to log in (no API call).
  if (!isAuthenticated) {
    return (
      <Link
        href={`/login?redirect=${encodeURIComponent(`/properties/${propertyId}`)}`}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
        aria-label="Sign in to add to favorites"
      >
        <span aria-hidden>♥</span>
        Sign in to save
      </Link>
    );
  }

  // Authenticated but not a GUEST (e.g. HOST/ADMIN): no favorites allowed.
  if (user && user.role !== UserRole.GUEST) {
    return (
      <span
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-400"
        aria-label="Favorites are only available for guest accounts"
        title="Favorites are only available for guest accounts"
      >
        <span aria-hidden>♥</span>
        Favorites
      </span>
    );
  }

  const isLoading = state === 'loading';
  const isFavorited = state === 'favorited';
  const label = isLoading
    ? '…'
    : isFavorited
      ? 'Saved'
      : 'Save';

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggleFavorite}
        disabled={isLoading}
        aria-pressed={isFavorited}
        aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
          isFavorited
            ? 'border-brand-600 bg-brand-50 text-brand-700 hover:bg-brand-100'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <span aria-hidden>♥</span>
        {label}
      </button>
      {errorMessage && (
        <p role="alert" className="text-xs text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

export default FavoriteButton;