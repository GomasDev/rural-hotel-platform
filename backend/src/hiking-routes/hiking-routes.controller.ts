// src/hiking-routes/hiking-routes.controller.ts

import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  Query, ParseFloatPipe, UseGuards,
} from '@nestjs/common';
import { HikingRoutesService } from './hiking-routes.service';
import { CreateHikingRouteDto } from './dto/create-hiking-route.dto';
import { UpdateHikingRouteDto } from './dto/update-hiking-route.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Difficulty } from './entities/hiking-route.entity';

// ── Controlador por hotel ─────────────────────────────────────────────────────
@Controller('hotels/:hotelId/hiking-routes')
export class HikingRoutesController {
  constructor(private readonly service: HikingRoutesService) {}

  @Get()
  findAll(
    @Param('hotelId') hotelId: string,
    @Query('difficulty') difficulty?: Difficulty,
  ) {
    if (difficulty) return this.service.findByDifficulty(difficulty);
    return this.service.findAllByHotel(hotelId);
  }

  @Get('nearby')
  findNearby(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius') radius?: string,
  ) {
    return this.service.findNearPoint(lat, lng, radius ? +radius : 10000);
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
    @Body() dto: CreateHikingRouteDto,
  ) {
    return this.service.create(hotelId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  update(@Param('id') id: string, @Body() dto: UpdateHikingRouteDto) {
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
@Controller('hiking-routes')
export class HikingRoutesGlobalController {
  constructor(private readonly service: HikingRoutesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}