import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FavoriteController } from './favorite.controller';
import { FavoriteListController } from './favorite-list.controller';
import { FavoriteService } from './favorite.service';

@Module({
  imports: [PrismaModule],
  controllers: [FavoriteController, FavoriteListController],
  providers: [FavoriteService],
  exports: [FavoriteService],
})
export class FavoriteModule {}