'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { adminService } from '@/lib/admin-service';
import { PropertyDetail } from '@/components/admin/PropertyDetail';

type AdminProperty = Awaited<ReturnType<typeof adminService.getProperty>>;

export default function AdminPropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
    <AdminLayout title="Property" subtitle="View property details.">
      <PropertyDetail id={id} />
    </AdminLayout>
  );
}

export type { AdminProperty };
