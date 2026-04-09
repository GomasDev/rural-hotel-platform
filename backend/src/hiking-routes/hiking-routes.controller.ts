import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  Query, ParseFloatPipe, UseGuards, UseInterceptors,
  UploadedFile, Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response } from 'express';
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

  // S4-05: Rutas ordenadas por proximidad
  @Get('nearby')
  findNearby(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius') radius?: string,
  ) {
    return this.service.findNearPoint(lat, lng, radius ? +radius : 10000);
  }

  // S4-04: GeoJSON para Leaflet
  @Get(':id/geojson')
  getGeoJson(@Param('id') id: string) {
    return this.service.findOneGeoJson(id);
  }

  // S4-06: Descarga GPX
@Get(':id/download-gpx')
async downloadGpx(@Param('id') id: string, @Res() res: Response) {
  const { gpx, name } = await this.service.generateGpx(id);

  if (gpx.startsWith('/uploads')) return res.redirect(gpx);

  const safeName = name
    .normalize('NFD')                    // descompone tildes: á → a + ́
    .replace(/[\u0300-\u036f]/g, '')     // elimina diacríticos
    .replace(/ñ/gi, 'n')
    .replace(/[^a-zA-Z0-9._-]/g, '_')   // cualquier otro carácter → _
    .slice(0, 100);                      // límite de longitud

  res.setHeader('Content-Type', 'application/gpx+xml');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}.gpx"`);
  return res.send(gpx);
}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  create(@Param('hotelId') hotelId: string, @Body() dto: CreateHikingRouteDto) {
    return this.service.create(hotelId, dto);
  }

  // S4-02: Subida de GPX
  @Post(':id/upload-gpx')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/gpx',
      filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
    }),
    fileFilter: (_, file, cb) => {
      if (!file.originalname.toLowerCase().endsWith('.gpx')) {
        return cb(new Error('Solo se permiten archivos .gpx'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  }))
  uploadGpx(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.processGpxUpload(id, file);
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

// ── Controlador global ────────────────────────────────────────────────────────
@Controller('hiking-routes')
export class HikingRoutesGlobalController {
  constructor(private readonly service: HikingRoutesService) {}

  @Get()
  findAll() { return this.service.findAll(); }
}