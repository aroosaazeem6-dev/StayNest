'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  adminService,
  type AdminPayment,
  type AdminPaymentListResponse,
} from '@/lib/admin-service';

const STATUSES = ['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'];

export function PaymentManagement() {
  const { tokens } = useAuth();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [state, setState] = useState<{
    status: 'loading' | 'success' | 'error';
    data: AdminPayment[] | null;
    meta: AdminPaymentListResponse['meta'] | null;
    error: string | null;
  }>({ status: 'loading', data: null, meta: null, error: null });

  useEffect(() => {
    if (!tokens?.accessToken) return;
    let mounted = true;
    setState((s) => ({ ...s, status: 'loading' }));
    adminService
      .listPayments(tokens.accessToken, { page, status: status || undefined })
      .then((res) => {
        if (!mounted) return;
        setState({ status: 'success', data: res.data, meta: res.meta, error: null });
      })
      .catch((err: unknown) => {
        const e = err as { status?: number; message?: string } | undefined;
        if (!mounted) return;
        setState({ status: 'error', data: null, meta: null, error: e?.message || 'Unable to load payments.' });
      });
    return () => {
      mounted = false;
    };
  }, [page, status, tokens]);

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
      <div className="mb-4">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Booking</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Provider</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Reference</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {state.data.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-gray-700">
                  {payment.bookingId.slice(0, 8)}
                </td>
                <td className="px-4 py-3 text-gray-700">{payment.provider ?? '—'}</td>
                <td className="px-4 py-3 text-gray-700">{payment.providerReference ?? '—'}</td>
                <td className="px-4 py-3 text-gray-700">
                  ${payment.amount} {payment.currency}
                </td>
                <td className="px-4 py-3">
                  <StatusSelect payment={payment} tokens={tokens} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/payments/${payment.id}`}
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

function StatusSelect({ payment, tokens }: { payment: AdminPayment; tokens: { accessToken?: string } | null }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(payment.status);

  async function handleChange(newStatus: string) {
    if (newStatus === payment.status) return;
    const accessToken = tokens?.accessToken;
    if (!accessToken) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await adminService.updatePaymentStatus(
        accessToken,
        payment.id,
        newStatus,
      );
      setStatus(updated.status);
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string } | undefined;
      setError(e?.message || 'Unable to update status.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <select
        value={status}
        onChange={(e) => void handleChange(e.target.value)}
        disabled={saving}
        className="rounded-lg border border-gray-300 px-2 py-1 text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}