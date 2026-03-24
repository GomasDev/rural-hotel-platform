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
import { use } from 'passport';
import { Admin, ResumeToken } from 'typeorm';
import { equal } from 'assert';
import { request } from 'express';
import { AvailableRoomDto } from './dto/available-room.dto';
import { UpdateBookingStatusDto } from './dto/update-reservation-status.dto';

@Controller('rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @Roles('super_admin', 'admin')
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @Get()
  @Roles('super_admin', 'admin', 'client')
  findAll() {
    return this.roomsService.findAll();
  }

  // GET /rooms/hotel/:hotelId → habitaciones de un hotel
  @Get('hotel/:hotelId')
  @Roles('super_admin', 'admin', 'client')
  findByHotel(@Param('hotelId') hotelId: string) {
    return this.roomsService.findByHotel(hotelId);
  }


  // S2-05 → disponibilidad por fechas (anti-overbooking) con control de roles
  @Get('available')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'client')
  async findAvailable(
    @Query('hotelId') hotelId: string,
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
  ): Promise<AvailableRoomDto[]> {
    return this.roomsService.findAvailable(hotelId, checkIn, checkOut);
  }

  // GET /rooms/available?hotelId=xxx&checkIn=2026-04-01&checkOut=2026-04-05
  @Get(':id')
  @Roles('super_admin', 'admin', 'client')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @Patch(':id')
  @Roles('super_admin', 'admin')
  update(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.roomsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('super_admin')
  remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }



  @Get('bookings/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  async getBookingStatus(@Param('id') id: string): Promise<string> {
    return this.roomsService.getBookingStatus(id);
  }

  @Patch('bookings/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  async updateBookingStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateBookingStatusDto,
  ): Promise<string> {
    return this.roomsService.updateBookingStatus(id, updateStatusDto.status);
  }

}
