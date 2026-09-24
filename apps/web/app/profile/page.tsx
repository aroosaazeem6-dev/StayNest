'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserRole } from '@prisma/client';

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="container-section flex min-h-[60vh] items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand-600" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  const isHost = Boolean(user.isHost === true || user.role === UserRole.HOST);

  return (
    <div className="container-section py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Account Settings</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Manage your StayNest account and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700">
                {user.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <h2 className="mt-3 text-base font-semibold text-gray-900">{user.name}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                {isHost ? 'Guest & Host' : 'Guest'}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">Account information</h3>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-xs font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900">{user.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Role</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900">{user.role}</dd>
              </div>
            </dl>
          </div>

          {isHost && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
              <h3 className="text-base font-semibold text-emerald-900">Host account</h3>
              <p className="mt-1.5 text-sm text-emerald-800">
                Your account can manage properties while still booking stays as a guest.
              </p>
              <div className="mt-4">
                <Link href="/host" className="btn-primary !py-2 !px-4">
                  Go to hosting
                </Link>
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button onClick={() => void logout()} className="btn-primary">
              Logout
            </button>
            <Link href="/dashboard" className="btn-secondary">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}