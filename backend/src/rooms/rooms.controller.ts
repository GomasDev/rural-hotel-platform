import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room-dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AvailableRoomDto } from './dto/available-room.dto';
import { UpdateBookingStatusDto } from './dto/update-reservation-status.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  //  PÚBLICOS
  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @Get('hotel/:hotelId')
  findByHotel(@Param('hotelId') hotelId: string) {
    return this.roomsService.findByHotel(hotelId);
  }

  @Get('available')
  findAvailable(
    @Query('hotelId') hotelId: string,
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
  ): Promise<AvailableRoomDto[]> {
    return this.roomsService.findAvailable(hotelId, checkIn, checkOut);
  }

  @Get(':id/occupied-dates')
  getOccupiedDates(@Param('id') id: string) {
    return this.roomsService.getOccupiedDates(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  //  PROTEGIDOS
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  update(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.roomsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }

  @Get('bookings/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  getBookingStatus(@Param('id') id: string) {
    return this.roomsService.getBookingStatus(id);
  }

  @Patch('bookings/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  updateBookingStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.roomsService.updateBookingStatus(id, dto.status);
  }
}