import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { BookingListResponseDto } from './dto/booking-list-response.dto';
import { HostBookingListResponseDto } from './dto/host-booking-list-response.dto';
import { HostBookingResponseDto } from './dto/host-booking-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller({ path: 'bookings', version: '1' })
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @Roles(UserRole.GUEST)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new booking (GUEST only)' })
  @ApiResponse({ status: 201, type: BookingResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error or invalid dates' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 409, description: 'Property is not available for the selected dates' })
  async create(
    @CurrentUser() guest: AuthenticatedUser,
    @Body() dto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookingService.create(guest, dto);
  }

  @Get('my')
  @Roles(UserRole.GUEST)
  @ApiOperation({ summary: 'List bookings for the authenticated guest' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Items per page (default: 10, max: 50)' })
  @ApiResponse({ status: 200, type: BookingListResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  async findMyBookings(
    @CurrentUser() guest: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<BookingListResponseDto> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.bookingService.findMyBookings(guest, pageNum, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a booking by ID (guest, property host, or admin)' })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<BookingResponseDto> {
    return this.bookingService.findOne(id, user);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking (guest, property host, or admin)' })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  @ApiResponse({ status: 400, description: 'Booking cannot be cancelled' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<BookingResponseDto> {
    return this.bookingService.cancel(id, user);
  }

  @Get('host/requests')
  @Roles(UserRole.HOST, UserRole.GUEST)
  @ApiOperation({ summary: 'List booking requests for properties owned by the host' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Items per page (default: 10, max: 50)' })
  @ApiResponse({ status: 200, type: HostBookingListResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Only hosts can view booking requests' })
  async findHostRequests(
    @CurrentUser() host: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<HostBookingListResponseDto> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.bookingService.findHostRequests(host, pageNum, limitNum);
  }

  @Patch(':id/host-accept')
  @Roles(UserRole.HOST, UserRole.GUEST)
  @ApiOperation({ summary: 'Accept a booking request (property host)' })
  @ApiResponse({ status: 200, type: HostBookingResponseDto })
  @ApiResponse({ status: 400, description: 'Booking is not in PENDING status' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Only the property host can accept this booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async hostAccept(
    @Param('id') id: string,
    @CurrentUser() host: AuthenticatedUser,
  ): Promise<HostBookingResponseDto> {
    return this.bookingService.hostAccept(id, host);
  }

  @Patch(':id/host-decline')
  @Roles(UserRole.HOST, UserRole.GUEST)
  @ApiOperation({ summary: 'Decline a booking request (property host)' })
  @ApiResponse({ status: 200, type: HostBookingResponseDto })
  @ApiResponse({ status: 400, description: 'Booking is not in PENDING status' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Only the property host can decline this booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async hostDecline(
    @Param('id') id: string,
    @CurrentUser() host: AuthenticatedUser,
  ): Promise<HostBookingResponseDto> {
    return this.bookingService.hostDecline(id, host);
  }
}
