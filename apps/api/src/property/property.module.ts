import { Module } from '@nestjs/common';
import { PropertyController } from './property.controller';
import { PropertyService } from './property.service';
import { BookingModule } from '../booking/booking.module';

@Module({
  imports: [BookingModule],
  controllers: [PropertyController],
  providers: [PropertyService],
})
export class PropertyModule {}
