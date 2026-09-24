import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import {
  Booking,
  BookingStatus,
  Property,
  PropertyStatus,
  User,
  UserRole,
  Prisma,
} from '@prisma/client';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { BookingListResponseDto, PaginationMetaDto } from './dto/booking-list-response.dto';
import { HostBookingResponseDto } from './dto/host-booking-response.dto';
import { HostBookingListResponseDto } from './dto/host-booking-list-response.dto';

type BookingWithProperty = Booking & {
  property: Pick<Property, 'id' | 'title' | 'propertyType' | 'city' | 'country' | 'pricePerNight' | 'hostId'>;
};

type BookingWithGuestAndProperty = Booking & {
  property: Pick<
    Property,
    'id' | 'title' | 'propertyType' | 'city' | 'country' | 'pricePerNight' | 'hostId'
  > & { images?: { url: string | null }[] };
  guest: Pick<User, 'id' | 'name' | 'email'>;
};

const HOST_BLOCKING_STATUSES = [
  BookingStatus.PENDING,
  BookingStatus.HOST_ACCEPTED,
  BookingStatus.CONFIRMED,
];

function isHostUser(user: AuthenticatedUser): boolean {
  return user.role === UserRole.HOST || user.isHost === true;
}

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  async checkAvailability(
    propertyId: string,
    dto: CheckAvailabilityDto,
  ): Promise<{ available: boolean }> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, status: true },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.status !== PropertyStatus.ACTIVE) {
      throw new NotFoundException('Property not found');
    }

    const checkInDate = this.toUtcDate(dto.checkIn);
    const checkOutDate = this.toUtcDate(dto.checkOut);

    this.validateDateRange(checkInDate, checkOutDate, 'checkIn');

    const overlapping = await this.prisma.booking.findFirst({
      where: {
        propertyId,
        status: { in: HOST_BLOCKING_STATUSES },
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      },
      select: { id: true },
    });

    return { available: !overlapping };
  }

  async create(
    guest: AuthenticatedUser,
    dto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    if (guest.role !== UserRole.GUEST) {
      throw new ForbiddenException('Only GUEST users can create bookings');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.status !== PropertyStatus.ACTIVE) {
      throw new NotFoundException('Property not found');
    }

    const checkInDate = this.toUtcDate(dto.checkIn);
    const checkOutDate = this.toUtcDate(dto.checkOut);

    this.validateDateRange(checkInDate, checkOutDate, 'checkIn');

    if (dto.guests > property.maxGuests) {
      throw new BadRequestException(
        `Number of guests (${dto.guests}) exceeds property maximum (${property.maxGuests})`,
      );
    }

    const nights = this.calculateNights(checkInDate, checkOutDate);
    const totalAmount = this.calculateTotal(nights, property.pricePerNight);

    const booking = await this.prisma.$transaction(async (tx) => {
      const overlapping = await tx.booking.findFirst({
        where: {
          propertyId: dto.propertyId,
          status: { in: HOST_BLOCKING_STATUSES },
          checkIn: { lt: checkOutDate },
          checkOut: { gt: checkInDate },
        },
        select: { id: true },
      });

      if (overlapping) {
        throw new ConflictException('Property is not available for the selected dates');
      }

      return tx.booking.create({
        data: {
          propertyId: dto.propertyId,
          guestId: guest.id,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          guests: dto.guests,
          totalAmount: new Prisma.Decimal(totalAmount),
        },
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
        },
      });
    });

    return this.toResponseDto(booking);
  }

  async findMyBookings(
    guest: AuthenticatedUser,
    page = 1,
    limit = 10,
  ): Promise<BookingListResponseDto> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where: { guestId: guest.id },
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
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
        },
      }),
      this.prisma.booking.count({ where: { guestId: guest.id } }),
    ]);

    const totalPages = Math.ceil(total / safeLimit);

    return {
      data: bookings.map((b) => this.toResponseDto(b)),
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
        hasNext: safePage < totalPages,
        hasPrev: safePage > 1,
      } as PaginationMetaDto,
    };
  }

  /**
   * List booking requests for properties owned by the authenticated host.
   * Host capability: role === HOST (legacy) OR isHost === true (GUEST-host).
   * Only returns bookings where the property's hostId matches the requesting user.
   */
  async findHostRequests(
    host: AuthenticatedUser,
    page = 1,
    limit = 10,
  ): Promise<HostBookingListResponseDto> {
    if (!isHostUser(host)) {
      throw new ForbiddenException('Only hosts can view booking requests');
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          property: { hostId: host.id },
        },
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
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
              images: {
                take: 1,
                select: { url: true },
                orderBy: { createdAt: 'asc' },
              },
            },
          },
          guest: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.booking.count({
        where: { property: { hostId: host.id } },
      }),
    ]);

    const totalPages = Math.ceil(total / safeLimit);

    return {
      data: bookings.map((b) => this.toHostResponseDto(b)),
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
        hasNext: safePage < totalPages,
        hasPrev: safePage > 1,
      } as PaginationMetaDto,
    };
  }

  /**
   * Accept a PENDING booking request — only the property owner/host may accept.
   * Transitions PENDING → HOST_ACCEPTED (awaiting admin approval).
   * Does NOT transition to CONFIRMED.
   */
  async hostAccept(
    id: string,
    host: AuthenticatedUser,
  ): Promise<HostBookingResponseDto> {
    if (!isHostUser(host)) {
      throw new ForbiddenException('Only hosts can accept booking requests');
    }

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
            images: {
              take: 1,
              select: { url: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        guest: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.property.hostId !== host.id) {
      throw new ForbiddenException(
        'You do not have permission to accept this booking request',
      );
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        `Booking cannot be accepted from status ${booking.status}`,
      );
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.HOST_ACCEPTED },
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
            images: {
              take: 1,
              select: { url: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        guest: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return this.toHostResponseDto(updated);
  }

  /**
   * Decline a PENDING booking request — only the property owner/host may decline.
   * Transitions PENDING → HOST_DECLINED (terminal).
   */
  async hostDecline(
    id: string,
    host: AuthenticatedUser,
  ): Promise<HostBookingResponseDto> {
    if (!isHostUser(host)) {
      throw new ForbiddenException('Only hosts can decline booking requests');
    }

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
            images: {
              take: 1,
              select: { url: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        guest: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.property.hostId !== host.id) {
      throw new ForbiddenException(
        'You do not have permission to decline this booking request',
      );
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        `Booking cannot be declined from status ${booking.status}`,
      );
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.HOST_DECLINED },
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
            images: {
              take: 1,
              select: { url: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        guest: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return this.toHostResponseDto(updated);
  }

  async findOne(
    id: string,
    requestingUser?: AuthenticatedUser,
  ): Promise<BookingResponseDto> {
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
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const isGuest = requestingUser?.id === booking.guestId;
    const isHost =
      requestingUser != null &&
      isHostUser(requestingUser) &&
      requestingUser.id === booking.property.hostId;
    const isAdmin = requestingUser?.role === UserRole.ADMIN;

    if (!isGuest && !isHost && !isAdmin) {
      throw new ForbiddenException('You do not have permission to view this booking');
    }

    return this.toResponseDto(booking);
  }

  async cancel(
    id: string,
    requestingUser: AuthenticatedUser,
  ): Promise<BookingResponseDto> {
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
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Completed bookings cannot be cancelled');
    }

    const isGuest = requestingUser.id === booking.guestId;
    const isHost =
      isHostUser(requestingUser) &&
      requestingUser.id === booking.property.hostId;
    const isAdmin = requestingUser.role === UserRole.ADMIN;

    if (!isGuest && !isHost && !isAdmin) {
      throw new ForbiddenException('You do not have permission to cancel this booking');
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
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
      },
    });

    return this.toResponseDto(updated);
  }

  private validateDateRange(checkIn: Date, checkOut: Date, field: string): void {
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    if (checkIn < todayStart) {
      throw new BadRequestException(`${field} cannot be in the past`);
    }

    if (checkOut <= checkIn) {
      throw new BadRequestException('checkOut must be after checkIn');
    }
  }

  private calculateNights(checkIn: Date, checkOut: Date): number {
    const utcCheckIn = Date.UTC(
      checkIn.getUTCFullYear(),
      checkIn.getUTCMonth(),
      checkIn.getUTCDate(),
    );
    const utcCheckOut = Date.UTC(
      checkOut.getUTCFullYear(),
      checkOut.getUTCMonth(),
      checkOut.getUTCDate(),
    );
    return Math.floor((utcCheckOut - utcCheckIn) / (1000 * 60 * 60 * 24));
  }

  private calculateTotal(nights: number, pricePerNight: Prisma.Decimal): number {
    return Number(new Prisma.Decimal(nights).times(pricePerNight));
  }

  private toUtcDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  private toResponseDto(booking: BookingWithProperty): BookingResponseDto {
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
    };
  }

  private toHostResponseDto(
    booking: BookingWithGuestAndProperty,
  ): HostBookingResponseDto {
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
        coverImage: booking.property.images?.[0]?.url ?? null,
      },
      guest: {
        id: booking.guest.id,
        name: booking.guest.name,
        email: booking.guest.email,
      },
    };
  }

  private toIsoDateString(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
