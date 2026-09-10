import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { JazzCashCallbackController } from './jazzcash-callback.controller';
import { PaymentService } from './payment.service';
import { JazzCashGateway } from './gateways/jazzcash/jazzcash.gateway';

@Module({
  controllers: [PaymentController, JazzCashCallbackController],
  providers: [PaymentService, JazzCashGateway],
  exports: [PaymentService],
})
export class PaymentModule {}