import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import {
  BookingStatus,
  PaymentStatus,
  PropertyStatus,
  UserRole,
} from '@prisma/client';
import { AdminDashboardOverviewResponseDto } from './dto/admin-dashboard-overview-response.dto';
import { ListAdminUsersQueryDto } from './dto/list-admin-users-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { AdminUserResponseDto } from './dto/admin-user-response.dto';
import { AdminUserListResponseDto } from './dto/admin-user-list-response.dto';
import { ListAdminPropertiesQueryDto } from './dto/list-admin-properties-query.dto';
import { UpdatePropertyStatusDto } from './dto/update-property-status.dto';
import { AdminPropertyResponseDto } from './dto/admin-property-response.dto';
import { AdminPropertyListResponseDto } from './dto/admin-property-list-response.dto';
import { ListAdminBookingsQueryDto } from './dto/list-admin-bookings-query.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { AdminBookingResponseDto } from './dto/admin-booking-response.dto';
import { AdminBookingListResponseDto } from './dto/admin-booking-list-response.dto';
import { ListAdminPaymentsQueryDto } from './dto/list-admin-payments-query.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { AdminPaymentResponseDto } from './dto/admin-payment-response.dto';
import { AdminPaymentListResponseDto } from './dto/admin-payment-list-response.dto';

type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

type SafeProperty = {
  id: string;
  hostId: string;
  title: string;
  description: string | null;
  propertyType: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  pricePerNight: any;
  maxGuests: number;
  bedrooms: number | null;
  bathrooms: number | null;
  status: PropertyStatus;
  createdAt: Date;
  updatedAt: Date;
  host: { id: string; name: string };
};

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardOverview(): Promise<AdminDashboardOverviewResponseDto> {
    const RECENT_LIMIT = 5;

    // Run all independent counts in parallel via a Prisma transaction.
    const [
      totalUsers,
      totalProperties,
      draftProperties,
      activeProperties,
      archivedProperties,
           totalBookings,
           pendingBookings,
           confirmedBookings,
           cancelledBookings,
           completedBookings,
           hostAcceptedBookings,
           hostDeclinedBookings,
      totalPayments,
      pendingPayments,
      succeededPayments,
      failedPayments,
      refundedPayments,
      totalReviews,
      totalFavorites,
      recentBookings,
      recentPayments,
      recentReviews,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.property.count(),
      this.prisma.property.count({ where: { status: PropertyStatus.DRAFT } }),
      this.prisma.property.count({ where: { status: PropertyStatus.ACTIVE } }),
      this.prisma.property.count({ where: { status: PropertyStatus.ARCHIVED } }),
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { status: BookingStatus.PENDING } }),
      this.prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
      this.prisma.booking.count({ where: { status: BookingStatus.CANCELLED } }),
      this.prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
      this.prisma.booking.count({ where: { status: BookingStatus.HOST_ACCEPTED } }),
      this.prisma.booking.count({ where: { status: BookingStatus.HOST_DECLINED } }),
      this.prisma.payment.count(),
      this.prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.SUCCEEDED } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.REFUNDED } }),
      this.prisma.review.count(),
      this.prisma.favorite.count(),
      this.prisma.booking.findMany({
        select: {
          id: true,
          propertyId: true,
          guestId: true,
          status: true,
          checkIn: true,
          checkOut: true,
          totalAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
      }),
      this.prisma.payment.findMany({
        select: {
          id: true,
          bookingId: true,
          provider: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
      }),
      this.prisma.review.findMany({
        select: {
          id: true,
          propertyId: true,
          guestId: true,
          rating: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
      }),
    ]);

    return {
      users: totalUsers,
      properties: totalProperties,
      propertyStatuses: {
        draft: draftProperties,
        active: activeProperties,
        archived: archivedProperties,
      },
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        cancelled: cancelledBookings,
        completed: completedBookings,
        hostAccepted: hostAcceptedBookings,
        hostDeclined: hostDeclinedBookings,
      },
      payments: {
        total: totalPayments,
        pending: pendingPayments,
        succeeded: succeededPayments,
        failed: failedPayments,
        refunded: refundedPayments,
      },
      reviews: totalReviews,
      favorites: totalFavorites,
      recentActivity: {
        recentBookings: recentBookings.map((b) => ({
          id: b.id,
          propertyId: b.propertyId,
          guestId: b.guestId,
          status: b.status,
          checkIn: this.toIsoDateString(b.checkIn),
          checkOut: this.toIsoDateString(b.checkOut),
          totalAmount: Number(b.totalAmount),
          createdAt: b.createdAt.toISOString(),
        })),
        recentPayments: recentPayments.map((p) => ({
          id: p.id,
          bookingId: p.bookingId,
          provider: p.provider,
          amount: Number(p.amount),
          currency: p.currency,
          status: p.status,
          createdAt: p.createdAt.toISOString(),
        })),
        recentReviews: recentReviews.map((r) => ({
          id: r.id,
          propertyId: r.propertyId,
          guestId: r.guestId,
          rating: r.rating,
          createdAt: r.createdAt.toISOString(),
        })),
      },
    };
  }

  async listUsers(query: ListAdminUsersQueryDto): Promise<AdminUserListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: data.map((user) => this.toUserResponse(user)),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getUser(id: string): Promise<AdminUserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toUserResponse(user);
  }

  async updateUserRole(
    admin: AuthenticatedUser,
    userId: string,
    dto: UpdateUserRoleDto,
  ): Promise<AdminUserResponseDto> {
    // Security rule: an admin must not be able to remove their own ADMIN role.
    if (admin.id === userId && dto.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Cannot remove your own ADMIN role',
      );
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.toUserResponse(user);
  }

  private toUserResponse(user: SafeUser): AdminUserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async listProperties(
    query: ListAdminPropertiesQueryDto,
  ): Promise<AdminPropertyListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
        { country: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.property.findMany({
        where,
        include: {
          host: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.property.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: data.map((property) => this.toPropertyResponse(property)),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getProperty(id: string): Promise<AdminPropertyResponseDto> {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, name: true } },
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return this.toPropertyResponse(property);
  }

  async updatePropertyStatus(
    id: string,
    dto: UpdatePropertyStatusDto,
  ): Promise<AdminPropertyResponseDto> {
    const property = await this.prisma.property.update({
      where: { id },
      data: { status: dto.status },
      include: {
        host: { select: { id: true, name: true } },
      },
    });

    return this.toPropertyResponse(property);
  }

  private toPropertyResponse(property: SafeProperty): AdminPropertyResponseDto {
    return {
      id: property.id,
      hostId: property.hostId,
      title: property.title,
      description: property.description,
      propertyType: property.propertyType as any,
      address: property.address,
      city: property.city,
      state: property.state,
      country: property.country,
      latitude: property.latitude,
      longitude: property.longitude,
      pricePerNight: Number(property.pricePerNight),
      maxGuests: property.maxGuests,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      status: property.status,
      createdAt: property.createdAt.toISOString(),
      updatedAt: property.updatedAt.toISOString(),
      host: {
        id: property.host.id,
        name: property.host.name,
      },
    };
  }

  async listBookings(
    query: ListAdminBookingsQueryDto,
  ): Promise<AdminBookingListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              propertyType: true,
              city: true,
              country: true,
              pricePerNight: true,
              hostId: true,
            },
          },
          guest: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: data.map((booking) => this.toBookingResponse(booking)),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getBooking(id: string): Promise<AdminBookingResponseDto> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            propertyType: true,
            city: true,
            country: true,
            pricePerNight: true,
            hostId: true,
          },
        },
        guest: { select: { id: true, name: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.toBookingResponse(booking);
  }

  async updateBookingStatus(
    id: string,
    dto: UpdateBookingStatusDto,
  ): Promise<AdminBookingResponseDto> {
    const current = await this.prisma.booking.findUnique({
      where: { id },
      select: { id: true, status: true, totalAmount: true },
    });

    if (!current) {
      throw new NotFoundException('Booking not found');
    }

    const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING]: [
        BookingStatus.CONFIRMED,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.HOST_ACCEPTED]: [
        BookingStatus.CONFIRMED,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.HOST_DECLINED]: [BookingStatus.CANCELLED],
      [BookingStatus.CONFIRMED]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
      [BookingStatus.CANCELLED]: [],
      [BookingStatus.COMPLETED]: [],
    };

    const allowed = VALID_TRANSITIONS[current.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition booking from ${current.status} to ${dto.status}`,
      );
    }

    const booking = await this.prisma.booking.update({
      where: { id },
      data: { status: dto.status },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            propertyType: true,
            city: true,
            country: true,
            pricePerNight: true,
            hostId: true,
          },
        },
        guest: { select: { id: true, name: true } },
      },
    });

    return this.toBookingResponse(booking);
  }

  private toBookingResponse(booking: any): AdminBookingResponseDto {
    return {
      id: booking.id,
      propertyId: booking.propertyId,
      guestId: booking.guestId,
      checkIn: this.toIsoDateString(booking.checkIn),
      checkOut: this.toIsoDateString(booking.checkOut),
      guests: booking.guests,
      status: booking.status,
      totalAmount: Number(booking.totalAmount),
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
      property: {
        id: booking.property.id,
        title: booking.property.title,
        propertyType: booking.property.propertyType,
        city: booking.property.city,
        country: booking.property.country,
        pricePerNight: Number(booking.property.pricePerNight),
        hostId: booking.property.hostId,
      },
      guest: {
        id: booking.guest.id,
        name: booking.guest.name,
      },
    };
  }

  private toIsoDateString(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async listPayments(
    query: ListAdminPaymentsQueryDto,
  ): Promise<AdminPaymentListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        include: {
          booking: {
            select: {
              id: true,
              guestId: true,
              propertyId: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: data.map((payment) => this.toPaymentResponse(payment)),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getPayment(id: string): Promise<AdminPaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            id: true,
            guestId: true,
            propertyId: true,
            status: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return this.toPaymentResponse(payment);
  }

  async updatePaymentStatus(
    id: string,
    dto: UpdatePaymentStatusDto,
  ): Promise<AdminPaymentResponseDto> {
    // Fetch the current payment to enforce safe state transitions.
    const current = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!current) {
      throw new NotFoundException('Payment not found');
    }

    // Security rule: PENDING -> SUCCEEDED is NOT allowed through this
    // generic admin endpoint. The existing JazzCash callback is the ONLY
    // path that marks a payment SUCCEEDED.
    if (
      current.status === PaymentStatus.PENDING &&
      dto.status === PaymentStatus.SUCCEEDED
    ) {
      throw new ForbiddenException(
        'Cannot mark payment as SUCCEEDED through admin endpoint; use the JazzCash callback flow',
      );
    }

    // Security rule: REFUNDED implies a real gateway refund that is not
    // implemented in this step.
    if (dto.status === PaymentStatus.REFUNDED) {
      throw new ForbiddenException(
        'Cannot mark payment as REFUNDED through admin endpoint; refunds are not implemented',
      );
    }

    // Security rule: SUCCEEDED payments must never be downgraded.
    if (
      current.status === PaymentStatus.SUCCEEDED &&
      dto.status !== PaymentStatus.SUCCEEDED
    ) {
      throw new ForbiddenException(
        'Cannot downgrade a SUCCEEDED payment',
      );
    }

    // Security rule: FAILED payments must never be upgraded to SUCCEEDED.
    if (
      current.status === PaymentStatus.FAILED &&
      dto.status === PaymentStatus.SUCCEEDED
    ) {
      throw new ForbiddenException(
        'Cannot upgrade a FAILED payment to SUCCEEDED',
      );
    }

    // Only update the status field. No amount/provider/providerReference changes.
    const payment = await this.prisma.payment.update({
      where: { id },
      data: { status: dto.status },
      include: {
        booking: {
          select: {
            id: true,
            guestId: true,
            propertyId: true,
            status: true,
          },
        },
      },
    });

    return this.toPaymentResponse(payment);
  }

  private toPaymentResponse(payment: any): AdminPaymentResponseDto {
    return {
      id: payment.id,
      bookingId: payment.bookingId,
      provider: payment.provider,
      providerReference: payment.providerReference,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
      booking: {
        id: payment.booking.id,
        guestId: payment.booking.guestId,
        propertyId: payment.booking.propertyId,
        status: payment.booking.status,
      },
    };
  }
}