'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

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

  return (
    <div className="container-section py-16">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Profile</h1>
      <div className="mt-6 max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <dl className="space-y-3">
          <div>
            <dt className="text-xs font-medium text-gray-500">Name</dt>
            <dd className="text-sm font-semibold text-gray-900">{user.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">Email</dt>
            <dd className="text-sm font-semibold text-gray-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">Role</dt>
            <dd className="text-sm font-semibold text-gray-900">{user.role}</dd>
          </div>
        </dl>
        <div className="mt-6 flex gap-3">
          <button onClick={() => void logout()} className="btn-primary">
            Logout
          </button>
          <Link href="/" className="btn-secondary">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}