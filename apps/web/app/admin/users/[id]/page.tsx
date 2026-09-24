'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { adminService } from '@/lib/admin-service';
import { UserDetail } from '@/components/admin/UserDetail';

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
    <AdminLayout title="User" subtitle="View and manage user details.">
      <UserDetail id={id} />
    </AdminLayout>
  );
}

export type { AdminUser };
