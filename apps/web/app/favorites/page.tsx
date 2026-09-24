import { Suspense } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { FavoriteList } from '@/components/dashboard/FavoriteList';

export const metadata = {
  title: 'Favorites — StayNest',
  description: 'Your saved StayNest properties.',
};

export default function FavoritesPage() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight text-[#26332D]">
          Saved stays
        </h1>
        <p className="mt-1.5 text-sm text-[#6B756E]">
          Properties you have saved for later.
        </p>
      </div>

      <Suspense fallback={<FavoritesSkeleton />}>
        <FavoriteList />
      </Suspense>
    </DashboardLayout>
  );
}

function FavoritesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-80 animate-pulse rounded-2xl border border-[#DDE3DA] bg-white"
        />
      ))}
    </div>
  );
}