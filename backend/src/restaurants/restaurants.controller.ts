// src/restaurants/restaurants.controller.ts

import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  Query, ParseFloatPipe, UseGuards,
} from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// ── Controlador por hotel ─────────────────────────────────────────────────────
@Controller('hotels/:hotelId/restaurants')
export class RestaurantsController {
  constructor(private readonly service: RestaurantsService) {}

  @Get()
  findAll(@Param('hotelId') hotelId: string) {
    return this.service.findAllByHotel(hotelId);
  }

  @Get('nearby')
  findNearby(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius') radius?: string,
  ) {
    return this.service.findNearby(lat, lng, radius ? +radius : 5000);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  create(
    @Param('hotelId') hotelId: string,
    @Body() dto: CreateRestaurantDto,
  ) {
    return this.service.create(hotelId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  update(@Param('id') id: string, @Body() dto: UpdateRestaurantDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

// ── Controlador global (landing) ──────────────────────────────────────────────
@Controller('restaurants')
export class RestaurantsGlobalController {
  constructor(private readonly service: RestaurantsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}