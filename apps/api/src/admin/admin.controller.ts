import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
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
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';

/**
 * Admin dashboard backend.
 *
 * All endpoints are ADMIN-only and protected by the existing JWT + role guard.
 */
@ApiTags('admin')
@ApiBearerAuth()
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/overview')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get admin dashboard overview statistics (ADMIN only)',
    description:
      'Returns high-level aggregate counts for users, properties, bookings ' +
      '(by status), payments (by status), reviews, and favorites, plus a property ' +
      'status breakdown and the most recent bookings, payments, and reviews. ' +
      'Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard overview statistics',
    type: AdminDashboardOverviewResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient role (ADMIN required)' })
  async getDashboardOverview(): Promise<AdminDashboardOverviewResponseDto> {
    return this.adminService.getDashboardOverview();
  }

  @Get('users')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'List users with pagination, role filter, and search (ADMIN only)',
    description:
      'Returns paginated users. Supports filtering by role and searching by name or email. ' +
      'Sorted newest first. Never returns passwordHash or refresh tokens.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of users',
    type: AdminUserListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient role (ADMIN required)' })
  async listUsers(
    @Query() query: ListAdminUsersQueryDto,
  ): Promise<AdminUserListResponseDto> {
    return this.adminService.listUsers(query);
  }

  @Get('users/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get a single user by ID (ADMIN only)',
    description:
      'Returns safe user information. Does not return passwordHash or refresh tokens.',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User details', type: AdminUserResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient role (ADMIN required)' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(
    @Param('id') id: string,
  ): Promise<AdminUserResponseDto> {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id/role')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a user\'s role (ADMIN only)',
    description:
      'Updates only the role field. An admin cannot remove their own ADMIN role.',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Updated user', type: AdminUserResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot remove own ADMIN role or invalid role' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient role (ADMIN required)' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserRole(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ): Promise<AdminUserResponseDto> {
    return this.adminService.updateUserRole(admin, id, dto);
  }

  @Get('properties')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'List all properties including non-ACTIVE ones (ADMIN only)',
    description:
      'Returns paginated properties regardless of public visibility status. ' +
      'Supports filtering by status and searching by title, city, or country. ' +
      'Sorted newest first. Does not expose host secrets or payment credentials.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of properties',
    type: AdminPropertyListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient role (ADMIN required)' })
  async listProperties(
    @Query() query: ListAdminPropertiesQueryDto,
  ): Promise<AdminPropertyListResponseDto> {
    return this.adminService.listProperties(query);
  }

  @Get('properties/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get a single property by ID for admin review (ADMIN only)',
    description:
      'Returns safe administrative property details including host name. ' +
      'Does not expose host email, passwordHash, refresh tokens, or payment credentials.',
  })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({ status: 200, description: 'Property details', type: AdminPropertyResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient role (ADMIN required)' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async getProperty(
    @Param('id') id: string,
  ): Promise<AdminPropertyResponseDto> {
    return this.adminService.getProperty(id);
  }

  @Patch('properties/:id/status')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a property\'s status (ADMIN only)',
    description:
      'Updates only the status field. Allowed values come from the existing PropertyStatus enum.',
  })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({ status: 200, description: 'Updated property', type: AdminPropertyResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid status' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient role (ADMIN required)' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async updatePropertyStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyStatusDto,
  ): Promise<AdminPropertyResponseDto> {
    return this.adminService.updatePropertyStatus(id, dto);
  }

  @Get('bookings')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'List all bookings regardless of status (ADMIN only)',
    description:
      'Returns paginated bookings for all guests and properties. ' +
      'Supports filtering by status. Sorted newest first. ' +
      'Includes safe guest and property details without exposing secrets.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of bookings',
    type: AdminBookingListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient role (ADMIN required)' })
  async listBookings(
    @Query() query: ListAdminBookingsQueryDto,
  ): Promise<AdminBookingListResponseDto> {
    return this.adminService.listBookings(query);
  }

  @Get('bookings/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get a single booking by ID for admin review (ADMIN only)',
    description:
      'Returns safe administrative booking details including guest name and property info. ' +
      'Does not expose guest email, passwordHash, refresh tokens, or payment credentials.',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking details', type: AdminBookingResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient role (ADMIN required)' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getBooking(
    @Param('id') id: string,
  ): Promise<AdminBookingResponseDto> {
    return this.adminService.getBooking(id);
  }

  @Patch('bookings/:id/status')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a booking\'s status (ADMIN only)',
    description:
      'Updates only the booking status field. Allowed values come from the existing BookingStatus enum. ' +
      'Does not modify payments, amounts, or dates.',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Updated booking', type: AdminBookingResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid status' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient role (ADMIN required)' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async updateBookingStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ): Promise<AdminBookingResponseDto> {
    return this.adminService.updateBookingStatus(id, dto);
  }

  @Get('payments')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'List all payments regardless of status (ADMIN only)',
    description:
      'Returns paginated payments for all bookings. ' +
      'Supports filtering by status. Sorted newest first. ' +
      'Does not expose JazzCash merchant password, integrity salt, tokens, or password hashes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of payments',
    type: AdminPaymentListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient role (ADMIN required)' })
  async listPayments(
    @Query() query: ListAdminPaymentsQueryDto,
  ): Promise<AdminPaymentListResponseDto> {
    return this.adminService.listPayments(query);
  }

  @Get('payments/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get a single payment by ID for admin review (ADMIN only)',
    description:
      'Returns safe administrative payment details including a safe booking subset. ' +
      'Does not expose JazzCash merchant password, integrity salt, tokens, or password hashes.',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment details', type: AdminPaymentResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient role (ADMIN required)' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPayment(
    @Param('id') id: string,
  ): Promise<AdminPaymentResponseDto> {
    return this.adminService.getPayment(id);
  }

  @Patch('payments/:id/status')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a payment\'s status (ADMIN only)',
    description:
      'Updates only the payment status field. ' +
      'Only PENDING -> FAILED transitions are allowed through this endpoint. ' +
      'PENDING -> SUCCEEDED is rejected because the JazzCash callback is the only path that ' +
      'marks a payment as succeeded. REFUNDED is rejected because refunds are not implemented. ' +
      'Does not modify amount, provider, providerReference, or the booking.',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Updated payment', type: AdminPaymentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid status' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient role (ADMIN required)' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentStatusDto,
  ): Promise<AdminPaymentResponseDto> {
    return this.adminService.updatePaymentStatus(id, dto);
  }
}