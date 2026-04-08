// src/hiking-routes/hiking-routes.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HikingRoute } from './entities/hiking-route.entity';
import { HikingRoutesService } from './hiking-routes.service';
import { HikingRoutesController, HikingRoutesGlobalController } from './hiking-routes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HikingRoute])],
  controllers: [HikingRoutesController, HikingRoutesGlobalController],
  providers: [HikingRoutesService],
  exports: [HikingRoutesService],
})
export class HikingRoutesModule {}