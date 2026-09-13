'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@prisma/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { adminService } from '@/lib/admin-service';

type AdminPayment = Awaited<ReturnType<typeof adminService.getPayment>>;

export default function AdminPaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Payment</h1>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
          <AdminSidebar />
          <PaymentDetail id={id} />
        </div>
      </div>
    </ProtectedRoute>
  );
}

function PaymentDetail({ id }: { id: string }) {
  const router = useRouter();
  const { tokens } = useAuth();
  const [payment, setPayment] = useState<AdminPayment | null>(null);
  const [state, setState] = useState<'loading' | 'success' | 'error' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokens?.accessToken) return;
    let mounted = true;
    setState('loading');
    adminService
      .getPayment(tokens.accessToken, id)
      .then((p) => {
        if (!mounted) return;
        setPayment(p);
        setState('success');
      })
      .catch((err: unknown) => {
        const e = err as { status?: number; message?: string } | undefined;
        if (!mounted) return;
        setState('error');
        setError(e?.status === 404 ? 'Payment not found.' : e?.message || 'Unable to load payment.');
      });
    return () => {
      mounted = false;
    };
  }, [id, tokens]);

  if (state === 'loading' || !payment) {
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
          <dt className="text-xs font-medium text-gray-500">Payment ID</dt>
          <dd className="mt-1 font-mono text-sm text-gray-900">{payment.id}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500">Status</dt>
          <dd className="mt-1 text-sm text-gray-900">{payment.status}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500">Booking</dt>
          <dd className="mt-1 font-mono text-sm text-gray-900">{payment.bookingId}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500">Provider</dt>
          <dd className="mt-1 text-sm text-gray-900">{payment.provider ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500">Reference</dt>
          <dd className="mt-1 text-sm text-gray-900">{payment.providerReference ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500">Amount</dt>
          <dd className="mt-1 text-sm text-gray-900">
            ${payment.amount} {payment.currency}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500">Created</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {new Date(payment.createdAt).toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500">Updated</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {new Date(payment.updatedAt).toLocaleString()}
          </dd>
        </div>
      </dl>
      <div className="mt-6 flex gap-3">
        <Link href="/admin/payments" className="btn-secondary">
          Back to payments
        </Link>
      </div>
    </div>
  );
}