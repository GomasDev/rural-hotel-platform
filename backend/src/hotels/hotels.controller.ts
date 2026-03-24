import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('hotels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Post()
  @Roles('super_admin', 'admin')
  create(@Body() dto: CreateHotelDto) {
    return this.hotelsService.create(dto);
  }

  @Get()
  @Roles('super_admin', 'admin', 'client')
  findAll() {
    return this.hotelsService.findAll();
  }

  // Para Sprint 3 → GET /hotels/nearby?lng=-3.70&lat=40.41&radius=10
  @Get('nearby')
  @Roles('super_admin', 'admin', 'client')
  findNearby(
    @Query('lng') lng: string,
    @Query('lat') lat: string,
    @Query('radius') radius: string,
  ) {
    return this.hotelsService.findNearby(+lng, +lat, +radius);
  }

  @Get(':id')
  @Roles('super_admin', 'admin', 'client')
  findOne(@Param('id') id: string) {
    return this.hotelsService.findOne(id);
  }

  @Patch(':id')
  @Roles('super_admin', 'admin')
  update(@Param('id') id: string, @Body() dto: UpdateHotelDto) {
    return this.hotelsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('super_admin')
  remove(@Param('id') id: string) {
    return this.hotelsService.remove(id);
  }
}
