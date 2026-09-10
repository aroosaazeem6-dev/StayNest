import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PaymentService } from './payment.service';
import { JazzCashCallbackResponse } from './gateways/jazzcash/jazzcash.types';
import { JazzCashCallbackTransformPipe } from './pipes/jazzcash-callback.transform.pipe';

/**
 * JazzCash callback endpoint.
 *
 * This controller is mounted OUTSIDE the JWT-authenticated `payments`
 * controller so that JazzCash can POST to it without an access token.
 *
 * The endpoint is registered on the root path so the final route is:
 *   POST /api/v1/payments/jazzcash/callback
 *
 * (The `payments` controller uses `@Controller({ path: 'payments', version: '1' })`.
 *  This controller uses the same path prefix minus the version so the route
 *  resolves identically under the API versioning prefix.)
 */
@ApiTags('payments')
@Public()
@Controller({ path: 'payments/jazzcash', version: '1' })
export class JazzCashCallbackController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint(true)
  @ApiOperation({
    summary: 'JazzCash payment callback (public, no JWT)',
    description:
      'Receives transaction results from JazzCash via HTTP POST. ' +
      'The secure hash is verified before any payment/booking state is mutated.',
  })
  @ApiResponse({ status: 200, description: 'Callback processed idempotently' })
  @ApiResponse({ status: 400, description: 'Invalid secure hash, merchant, currency, or amount' })
  @ApiResponse({ status: 404, description: 'Unknown transaction reference' })
  async callback(
    @Body(JazzCashCallbackTransformPipe) response: JazzCashCallbackResponse,
  ): Promise<{ success: boolean }> {
    return this.paymentService.handleJazzCashCallback(response);
  }
}