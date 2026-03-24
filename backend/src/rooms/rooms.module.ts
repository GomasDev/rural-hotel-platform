import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { Room } from './entities/room.entity';
import { Hotel } from '../hotels/entities/hotel.entity';
import { Booking } from './entities/reservation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Hotel, Booking])],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
