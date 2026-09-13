import { ApiProperty } from '@nestjs/swagger';

export class AdminPropertyStatusStatsDto {
  @ApiProperty({ description: 'Draft properties', example: 5 })
  draft!: number;

  @ApiProperty({ description: 'Active properties', example: 30 })
  active!: number;

  @ApiProperty({ description: 'Archived properties', example: 5 })
  archived!: number;
}

export class AdminBookingStatsDto {
  @ApiProperty({ description: 'Total bookings', example: 120 })
  total!: number;

  @ApiProperty({ description: 'Pending bookings', example: 10 })
  pending!: number;

  @ApiProperty({ description: 'Confirmed bookings', example: 80 })
  confirmed!: number;

  @ApiProperty({ description: 'Cancelled bookings', example: 15 })
  cancelled!: number;

  @ApiProperty({ description: 'Completed bookings', example: 15 })
  completed!: number;
}

export class AdminPaymentStatsDto {
  @ApiProperty({ description: 'Total payments', example: 115 })
  total!: number;

  @ApiProperty({ description: 'Pending payments', example: 5 })
  pending!: number;

  @ApiProperty({ description: 'Succeeded payments', example: 100 })
  succeeded!: number;

  @ApiProperty({ description: 'Failed payments', example: 7 })
  failed!: number;

  @ApiProperty({ description: 'Refunded payments', example: 3 })
  refunded!: number;
}

export class AdminRecentBookingDto {
  @ApiProperty({ description: 'Booking ID' })
  id!: string;

  @ApiProperty({ description: 'Property ID' })
  propertyId!: string;

  @ApiProperty({ description: 'Guest user ID' })
  guestId!: string;

  @ApiProperty({ description: 'Booking status', example: 'PENDING' })
  status!: string;

  @ApiProperty({ description: 'Check-in date (YYYY-MM-DD)' })
  checkIn!: string;

  @ApiProperty({ description: 'Check-out date (YYYY-MM-DD)' })
  checkOut!: string;

  @ApiProperty({ description: 'Total amount' })
  totalAmount!: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: string;
}

export class AdminRecentPaymentDto {
  @ApiProperty({ description: 'Payment ID' })
  id!: string;

  @ApiProperty({ description: 'Booking ID' })
  bookingId!: string;

  @ApiProperty({ description: 'Payment provider', example: 'JAZZCASH', nullable: true })
  provider!: string | null;

  @ApiProperty({ description: 'Payment amount' })
  amount!: number;

  @ApiProperty({ description: 'Currency code', example: 'PKR' })
  currency!: string;

  @ApiProperty({ description: 'Payment status', example: 'PENDING' })
  status!: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: string;
}

export class AdminRecentReviewDto {
  @ApiProperty({ description: 'Review ID' })
  id!: string;

  @ApiProperty({ description: 'Property ID' })
  propertyId!: string;

  @ApiProperty({ description: 'Guest user ID' })
  guestId!: string;

  @ApiProperty({ description: 'Rating from 1 to 5' })
  rating!: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: string;
}

export class AdminRecentActivityDto {
  @ApiProperty({ type: [AdminRecentBookingDto], description: 'Most recent bookings' })
  recentBookings!: AdminRecentBookingDto[];

  @ApiProperty({ type: [AdminRecentPaymentDto], description: 'Most recent payments' })
  recentPayments!: AdminRecentPaymentDto[];

  @ApiProperty({ type: [AdminRecentReviewDto], description: 'Most recent reviews' })
  recentReviews!: AdminRecentReviewDto[];
}

export class AdminDashboardOverviewResponseDto {
  @ApiProperty({ description: 'Total users', example: 250 })
  users!: number;

  @ApiProperty({ description: 'Total properties', example: 40 })
  properties!: number;

  @ApiProperty({ type: AdminPropertyStatusStatsDto, description: 'Property status breakdown' })
  propertyStatuses!: AdminPropertyStatusStatsDto;

  @ApiProperty({ type: AdminBookingStatsDto, description: 'Booking statistics by status' })
  bookings!: AdminBookingStatsDto;

  @ApiProperty({ type: AdminPaymentStatsDto, description: 'Payment statistics by status' })
  payments!: AdminPaymentStatsDto;

  @ApiProperty({ description: 'Total reviews', example: 80 })
  reviews!: number;

  @ApiProperty({ description: 'Total favorites', example: 200 })
  favorites!: number;

  @ApiProperty({ type: AdminRecentActivityDto, description: 'Recent admin activity' })
  recentActivity!: AdminRecentActivityDto;
}