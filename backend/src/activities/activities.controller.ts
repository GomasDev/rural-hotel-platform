import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('hotels/:hotelId/activities')
export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}

    //PÚBLICOS — sin token
  @Get()
  findAll(@Param('hotelId') hotelId: string) {
    return this.service.findAllByHotel(hotelId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  //PROTEGIDOS — requieren token y rol
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  create(@Param('hotelId') hotelId: string, @Body() dto: CreateActivityDto) {
    return this.service.create(hotelId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  update(@Param('id') id: string, @Body() dto: UpdateActivityDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

// Global
import { Controller as Ctrl, Get as G } from '@nestjs/common';
@Ctrl('activities')
export class ActivitiesGlobalController {
  constructor(private readonly service: ActivitiesService) {}
  @G() findAll() { return this.service.findAll(); }
}