import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentInitiateResponseDto } from './dto/payment-initiate-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Response } from 'express';

@ApiTags('payments')
@ApiBearerAuth()
@Controller({ path: 'payments', version: '1' })
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @Roles(UserRole.GUEST)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a payment for a booking and get JazzCash initiation data (GUEST only)' })
  @ApiResponse({ status: 201, type: PaymentInitiateResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error, invalid booking state, or JazzCash not configured' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient role or not booking owner' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async create(
    @CurrentUser() guest: AuthenticatedUser,
    @Body() dto: CreatePaymentDto,
  ): Promise<PaymentInitiateResponseDto> {
    return this.paymentService.create(guest, dto);
  }

  @Get(':id/jazzcash/redirect')
  @Roles(UserRole.GUEST)
  @ApiOperation({ summary: 'Redirect to JazzCash hosted payment page (GUEST only)' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'HTML form that auto-submits to JazzCash', content: { 'text/html': {} } })
  @ApiResponse({ status: 400, description: 'Payment not in PENDING state or JazzCash not configured' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient role or not payment owner' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async jazzcashRedirect(
    @CurrentUser() guest: AuthenticatedUser,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const redirectData = await this.paymentService.prepareJazzCashRedirect(guest, id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(redirectData.html);
  }
}