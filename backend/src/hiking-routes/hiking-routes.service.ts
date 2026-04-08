// src/hiking-routes/hiking-routes.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HikingRoute, Difficulty } from './entities/hiking-route.entity';
import { CreateHikingRouteDto } from './dto/create-hiking-route.dto';
import { UpdateHikingRouteDto } from './dto/update-hiking-route.dto';

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
    return this.repo.find({ where: { isActive: true } });
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

  findNearPoint(lat: number, lng: number, radiusMeters = 10000): Promise<HikingRoute[]> {
    return this.repo
      .createQueryBuilder('r')
      .where(
        `ST_DWithin(r.route_geom::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)`,
        { lat, lng, radius: radiusMeters },
      )
      .andWhere('r.is_active = true')
      .getMany();
  }
}