'use client';

import { BookingStatus } from '@prisma/client';

interface BookingStatusBadgeProps {
  status: string;
}

const statusConfig: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  [BookingStatus.PENDING]: {
    label: 'Pending',
    className: 'bg-[#FFF7E6] text-[#924E2E]',
    dot: 'bg-[#FFB347]',
  },
  [BookingStatus.HOST_ACCEPTED]: {
    label: 'Accepted',
    className: 'bg-[#F0F9FF] text-[#0369A3]',
    dot: 'bg-[#0EA5E9]',
  },
  [BookingStatus.HOST_DECLINED]: {
    label: 'Declined',
    className: 'bg-[#FDE7E7] text-[#B42328]',
    dot: 'bg-[#EF4444]',
  },
  [BookingStatus.CONFIRMED]: {
    label: 'Confirmed',
    className: 'bg-[#ECFDF5] text-[#047857]',
    dot: 'bg-[#10B981]',
  },
  [BookingStatus.CANCELLED]: {
    label: 'Cancelled',
    className: 'bg-[#F3F4F6] text-[#374151]',
    dot: 'bg-[#9CA3AF]',
  },
  [BookingStatus.COMPLETED]: {
    label: 'Completed',
    className: 'bg-[#F0FDF4] text-[#3F623F]',
    dot: 'bg-[#4ADE80]',
  },
};

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig[BookingStatus.PENDING];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export default BookingStatusBadge;
