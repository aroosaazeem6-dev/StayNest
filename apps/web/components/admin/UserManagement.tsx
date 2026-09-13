'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  adminService,
  type AdminUser,
  type AdminUserListResponse,
} from '@/lib/admin-service';

const ROLES = ['GUEST', 'HOST', 'ADMIN'];

export function UserManagement() {
  const { tokens } = useAuth();
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [state, setState] = useState<{
    status: 'loading' | 'success' | 'error';
    data: AdminUser[] | null;
    meta: AdminUserListResponse['meta'] | null;
    error: string | null;
  }>({ status: 'loading', data: null, meta: null, error: null });

  useEffect(() => {
    if (!tokens?.accessToken) return;
    let mounted = true;
    setState((s) => ({ ...s, status: 'loading' }));
    adminService
      .listUsers(tokens.accessToken, { page, role: role || undefined, search: search || undefined })
      .then((res) => {
        if (!mounted) return;
        setState({ status: 'success', data: res.data, meta: res.meta, error: null });
      })
      .catch((err: unknown) => {
        const e = err as { status?: number; message?: string } | undefined;
        if (!mounted) return;
        setState({ status: 'error', data: null, meta: null, error: e?.message || 'Unable to load users.' });
      });
    return () => {
      mounted = false;
    };
  }, [page, role, search, tokens]);

  if (state.status === 'error') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{state.error}</p>
      </div>
    );
  }

  if (state.status === 'loading' || !state.data) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="h-12 animate-pulse bg-gray-100" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse bg-gray-50" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Search name or email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:max-w-xs"
        />
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Role</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Created</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {state.data.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                <td className="px-4 py-3 text-gray-700">{user.email}</td>
                <td className="px-4 py-3">
                  <RoleSelect user={user} tokens={tokens} />
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-brand-600 hover:underline"
                  >
                    Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {state.meta && state.meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {state.meta.page} of {state.meta.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!state.meta.hasPrev}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!state.meta.hasNext}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RoleSelect({ user, tokens }: { user: AdminUser; tokens: { accessToken?: string } | null }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState(user.role);

  async function handleChange(newRole: string) {
    if (newRole === user.role) return;
    const accessToken = tokens?.accessToken;
    if (!accessToken) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await adminService.updateUserRole(accessToken, user.id, newRole);
      setRole(updated.role);
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string } | undefined;
      setError(e?.message || 'Unable to update role.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <select
        value={role}
        onChange={(e) => void handleChange(e.target.value)}
        disabled={saving}
        className="rounded-lg border border-gray-300 px-2 py-1 text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}