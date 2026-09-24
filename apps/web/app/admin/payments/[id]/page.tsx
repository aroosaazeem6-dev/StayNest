'use client';

import { useEffect, useState } from 'react';
import { UserRole } from '@prisma/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { PaymentDetail } from '@/components/admin/PaymentDetail';

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
      <AdminLayout title="Payment">
        <PaymentDetail id={id} />
      </AdminLayout>
    </ProtectedRoute>
  );
}
