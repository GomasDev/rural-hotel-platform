import {
  Controller, Get, Post, Patch, Param, Body,
  UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(req.user.userId, dto);
  }

  @Get()
  findMine(@Request() req: any) {
    return this.bookingsService.findByUser(req.user.userId);
  }

  @Get('room/:roomId')
  findByRoom(@Param('roomId') roomId: string, @Request() req: any) {
    return this.bookingsService.findByRoom(
      roomId,
      req.user.userId,
      req.user.role,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.bookingsService.findOne(
      id,
      req.user.userId,
      req.user.role,
    );
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.bookingsService.cancel(
      id,
      req.user.userId,
      req.user.role,
    );
  }

  @Patch(':id/confirm')
  confirm(@Param('id') id: string, @Request() req: any) {
    return this.bookingsService.confirm(id, req.user.userId, req.user.role);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string, @Request() req: any) {
    return this.bookingsService.complete(id, req.user.userId, req.user.role);
}
}