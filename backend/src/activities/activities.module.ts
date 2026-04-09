import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { Hotel } from '../hotels/entities/hotel.entity';
import { ActivitiesService } from './activities.service';
import { ActivitiesController, ActivitiesGlobalController } from './activities.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Activity, Hotel])],
  controllers: [ActivitiesController, ActivitiesGlobalController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}