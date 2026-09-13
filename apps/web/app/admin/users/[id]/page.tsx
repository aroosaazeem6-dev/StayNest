'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@prisma/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { adminService } from '@/lib/admin-service';

type AdminUser = Awaited<ReturnType<typeof adminService.getUser>>;

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    params.then((p) => {
      if (mounted) setId(p.id);
    });
    return () => {
      mounted = false;
    };
  }, [params]);

  if (!id) return null;

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <div className="container-section py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">User</h1>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
          <AdminSidebar />
          <UserDetail id={id} />
        </div>
      </div>
    </ProtectedRoute>
  );
}

function UserDetail({ id }: { id: string }) {
  const router = useRouter();
  const { tokens } = useAuth();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [state, setState] = useState<'loading' | 'success' | 'error' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokens?.accessToken) return;
    let mounted = true;
    setState('loading');
    adminService
      .getUser(tokens.accessToken, id)
      .then((u) => {
        if (!mounted) return;
        setUser(u);
        setState('success');
      })
      .catch((err: unknown) => {
        const e = err as { status?: number; message?: string } | undefined;
        if (!mounted) return;
        setState('error');
        setError(e?.status === 404 ? 'User not found.' : e?.message || 'Unable to load user.');
      });
    return () => {
      mounted = false;
    };
  }, [id, tokens]);

  if (state === 'loading' || !user) {
    return <div className="h-64 animate-pulse rounded-xl bg-gray-100" />;
  }

  if (state === 'error') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{error}</p>
        <button onClick={() => router.refresh()} className="btn-primary mt-4">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-gray-500">ID</dt>
          <dd className="mt-1 font-mono text-sm text-gray-900">{user.id}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500">Name</dt>
          <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500">Email</dt>
          <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500">Role</dt>
          <dd className="mt-1 text-sm text-gray-900">{user.role}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500">Created</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {new Date(user.createdAt).toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500">Updated</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {new Date(user.updatedAt).toLocaleString()}
          </dd>
        </div>
      </dl>
      <div className="mt-6">
        <Link href="/admin/users" className="btn-secondary">
          Back to users
        </Link>
      </div>
    </div>
  );
}