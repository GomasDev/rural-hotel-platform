import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HikingRoute, Difficulty } from './entities/hiking-route.entity';
import { CreateHikingRouteDto } from './dto/create-hiking-route.dto';
import { UpdateHikingRouteDto } from './dto/update-hiking-route.dto';
import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs';

@Injectable()
export class HikingRoutesService {
  constructor(
    @InjectRepository(HikingRoute)
    private readonly repo: Repository<HikingRoute>,
  ) {}

  create(hotelId: string, dto: CreateHikingRouteDto): Promise<HikingRoute> {
    const route = this.repo.create({ ...dto, hotelId });
    return this.repo.save(route);
  }

  // ── Global (landing) ───────────────────────────────────────────────────────
  findAll(): Promise<HikingRoute[]> {
    return this.repo.find({
      where: { isActive: true },
      relations: { hotel: true },
      select: {
        id: true, name: true, description: true,
        difficulty: true, distanceKm: true,
        durationMinutes: true, elevationGainM: true,
        images: true, isActive: true,
        hotel: { id: true, name: true, address: true },
      },
    });
  }

  // ── Por hotel ──────────────────────────────────────────────────────────────
  findAllByHotel(hotelId: string): Promise<HikingRoute[]> {
    return this.repo.find({ where: { hotelId, isActive: true } });
  }

  findByDifficulty(difficulty: Difficulty): Promise<HikingRoute[]> {
    return this.repo.find({ where: { difficulty, isActive: true } });
  }

  async findOne(id: string): Promise<HikingRoute> {
    const route = await this.repo.findOne({ where: { id } });
    if (!route) throw new NotFoundException(`Ruta ${id} no encontrada`);
    return route;
  }

  async update(id: string, dto: UpdateHikingRouteDto): Promise<HikingRoute> {
    const route = await this.findOne(id);
    Object.assign(route, dto);
    return this.repo.save(route);
  }

  async remove(id: string): Promise<void> {
    const route = await this.findOne(id);
    await this.repo.remove(route);
  }

  // ── S4-03/S4-05: ST_Distance ordenado por proximidad ──────────────────────
  async findNearPoint(lat: number, lng: number, radiusMeters = 10000): Promise<HikingRoute[]> {
    const { entities } = await this.repo
      .createQueryBuilder('r')
      .addSelect(
        `ST_Distance(r.route_geom::geography, ST_SetSRID(ST_MakePoint(:lng2, :lat2), 4326)::geography)`,
        'distance',
      )
      .where(
        `ST_DWithin(r.route_geom::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)`,
      )
      .andWhere('r.is_active = true')
      .orderBy('distance', 'ASC')
      .setParameters({ lat, lng, lat2: lat, lng2: lng, radius: radiusMeters })
      .getRawAndEntities();
    return entities;
  }

  // ── S4-04: GeoJSON para Leaflet ───────────────────────────────────────────
  async findOneGeoJson(id: string): Promise<{ route: HikingRoute; geojson: any }> {
    const [route, raw] = await Promise.all([
      this.findOne(id),
      this.repo
        .createQueryBuilder('r')
        .select('ST_AsGeoJSON(r.route_geom)::json', 'geojson')
        .where('r.id = :id', { id })
        .getRawOne(),
    ]);
    return { route, geojson: raw?.geojson ?? null };
  }

  // ── S4-02: Subida y parseo de GPX ─────────────────────────────────────────
  async processGpxUpload(routeId: string, file: Express.Multer.File): Promise<HikingRoute> {
    const gpxContent = fs.readFileSync(file.path, 'utf-8');
    const wkt = this.parseGpxToWkt(gpxContent);
    const route = await this.findOne(routeId);
    route.routeGeom = wkt;
    route.gpxFileUrl = `/uploads/gpx/${file.filename}`;
    return this.repo.save(route);
  }

  private parseGpxToWkt(gpxContent: string): string {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const result = parser.parse(gpxContent);

    let trkpts = result?.gpx?.trk?.trkseg?.trkpt;
    if (!trkpts) throw new BadRequestException('GPX inválido: sin puntos de ruta');
    if (!Array.isArray(trkpts)) trkpts = [trkpts];
    if (trkpts.length < 2) throw new BadRequestException('La ruta necesita al menos 2 puntos');

    const coords = trkpts
      .map((pt: any) => `${pt['@_lon']} ${pt['@_lat']}`)
      .join(', ');

    return `SRID=4326;LINESTRING(${coords})`;
  }

  // ── S4-06: Generar GPX desde routeGeom ────────────────────────────────────
  async generateGpx(id: string): Promise<{ gpx: string; name: string }> {
    const route = await this.findOne(id);

    // Si tiene archivo GPX original, devolver su URL
    if (route.gpxFileUrl) return { gpx: route.gpxFileUrl, name: route.name };

    const raw = await this.repo
      .createQueryBuilder('r')
      .select('ST_AsGeoJSON(r.route_geom)::json', 'geojson')
      .where('r.id = :id', { id })
      .getRawOne();

    const geojson = raw?.geojson;
    if (!geojson) throw new BadRequestException('La ruta no tiene geometría');

    const coords: [number, number][] = geojson.coordinates;
    const trkpts = coords
      .map(([lng, lat]) => `    <trkpt lat="${lat}" lon="${lng}"></trkpt>`)
      .join('\n');

    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RuralHot" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${route.name}</name>
    <desc>${route.description ?? ''}</desc>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;

    return { gpx, name: route.name };
  }
}