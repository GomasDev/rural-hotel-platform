import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

// ✅ Sin @UseGuards en la clase — cada método gestiona su propio acceso
@Controller('hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  //PÚBLICOS — sin token
  @Get()
  findAll(
    @Query('page')   page   = '1',
    @Query('limit')  limit  = '9',
    @Query('search') search = '',
    @Query('sortBy') sortBy = 'createdAt',
    @Query('order')  order  = 'DESC',      
  ) {
    return this.hotelsService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
    });
  }

  @Get('nearby')
  findNearby(
    @Query('lng') lng: string,
    @Query('lat') lat: string,
    @Query('radius') radius: string,
  ) {
    return this.hotelsService.findNearby(+lng, +lat, +radius);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hotelsService.findOne(id);
  }

  //PROTEGIDOS — requieren token y rol
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  create(
    @Body() dto: CreateHotelDto,
    @GetUser('userId') ownerId: string,
  ) {
    return this.hotelsService.create(dto, ownerId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  update(@Param('id') id: string, @Body() dto: UpdateHotelDto) {
    return this.hotelsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  remove(@Param('id') id: string) {
    return this.hotelsService.remove(id);
  }
}