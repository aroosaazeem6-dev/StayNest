'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { favoriteService, type Favorite } from '@/lib/favorite-service';
import { FavoriteCard } from './FavoriteCard';

export function FavoriteList() {
  const { isAuthenticated, isLoading: authLoading, tokens } = useAuth();
  const [page, setPage] = useState(1);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [state, setState] = useState<{
    status: 'loading' | 'success' | 'error' | 'empty';
    data: Favorite[] | null;
    error: string | null;
  }>({ status: 'loading', data: null, error: null });

  useEffect(() => {
    if (authLoading || !isAuthenticated || !tokens?.accessToken) return;
    let mounted = true;
    setState((s) => ({ ...s, status: 'loading' }));
    favoriteService
      .findMine(tokens.accessToken, page)
      .then((res) => {
        if (!mounted) return;
        if (res.data.length === 0) {
          setState({ status: 'empty', data: null, error: null });
        } else {
          setState({ status: 'success', data: res.data, error: null });
        }
      })
      .catch((err: unknown) => {
        const e = err as { status?: number; message?: string } | undefined;
        if (!mounted) return;
        setState({
          status: 'error',
          data: null,
          error: e?.status === 401 ? 'Session expired.' : e?.message || 'Unable to load favorites.',
        });
      });
    return () => {
      mounted = false;
    };
  }, [page, authLoading, isAuthenticated, tokens]);

  async function handleRemove(propertyId: string) {
    if (!tokens?.accessToken) return;
    setRemovingId(propertyId);
    try {
      await favoriteService.remove(propertyId, tokens.accessToken);
      // Refresh current page.
      setState((s) => ({ ...s, status: 'loading' }));
      const res = await favoriteService.findMine(tokens.accessToken, page);
      if (res.data.length === 0 && page > 1) {
        setPage(1);
        return;
      }
      if (res.data.length === 0) {
        setState({ status: 'empty', data: null, error: null });
      } else {
        setState({ status: 'success', data: res.data, error: null });
      }
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string } | undefined;
      setState({
        status: 'error',
        data: null,
        error: e?.message || 'Unable to remove favorite.',
      });
    } finally {
      setRemovingId(null);
    }
  }

  if (authLoading || !isAuthenticated) {
    return <LoadingState />;
  }

  if (state.status === 'loading') {
    return <LoadingState />;
  }

  if (state.status === 'error') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{state.error}</p>
        <button
          onClick={() => setState((s) => ({ ...s, status: 'loading' }))}
          className="btn-primary mt-4"
        >
          Retry
        </button>
      </div>
    );
  }

  if (state.status === 'empty' || !state.data) {
    return (
      <div className="rounded-2xl border border-[#DDE3DA] bg-white p-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF1E7] text-[#879B89]">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.6">
            <path
              d="M20.8 8.8c0 5.5-8.8 10.2-8.8 10.2S3.2 14.3 3.2 8.8A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="mt-4 text-base font-medium text-[#26332D]">No saved stays yet</p>
        <p className="mt-1 text-sm text-[#6B756E]">
          Explore properties and tap the heart to save your favorites.
        </p>
        <Link href="/properties" className="btn-primary mt-5">
          Explore stays
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {state.data.map((fav) => (
          <FavoriteCard
            key={fav.id}
            favorite={fav}
            onRemove={handleRemove}
            removing={removingId === fav.property.id}
          />
        ))}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-80 animate-pulse rounded-xl bg-gray-100" />
      ))}
    </div>
  );
}