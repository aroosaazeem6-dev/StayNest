import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@prisma/client';
import { Suspense } from 'react';
import { FavoriteList } from '@/components/dashboard/FavoriteList';

export const metadata = {
  title: 'Favorites — StayNest',
  description: 'Your saved StayNest properties.',
};

export default function FavoritesPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.GUEST]}>
      <div className="container-section py-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Favorites</h1>
        <p className="mt-2 text-gray-600">
          Properties you have saved for later.
        </p>
        <div className="mt-6">
          <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-gray-100" />}>
            <FavoriteList />
          </Suspense>
        </div>
      </div>
    </ProtectedRoute>
  );
}