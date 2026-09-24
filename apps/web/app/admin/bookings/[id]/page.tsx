'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { adminService } from '@/lib/admin-service';
import { BookingDetail } from '@/components/admin/BookingDetail';

type AdminBooking = Awaited<ReturnType<typeof adminService.getBooking>>;

export default function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
    <AdminLayout title="Booking" subtitle="View booking details.">
      <BookingDetail id={id} />
    </AdminLayout>
  );
}

export type { AdminBooking };
