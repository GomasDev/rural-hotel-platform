// src/restaurants/restaurants.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly repo: Repository<Restaurant>,
  ) {}

  async create(hotelId: string, dto: CreateRestaurantDto): Promise<Restaurant> {
    const { location, ...rest } = dto;
    const wkt = `POINT(${location.lng} ${location.lat})`;
    const restaurant = this.repo.create({ ...rest, hotelId, location: wkt });
    return this.repo.save(restaurant);
  }

  // ── Global (landing) ───────────────────────────────────────────────────────
findAll(): Promise<Restaurant[]> {
  return this.repo.find({
    where: { isActive: true },
    relations: { hotel: true },
    select: {
      id: true, name: true, description: true,
      cuisineType: true, priceRange: true, rating: true,
      images: true, isActive: true,
      hotel: { id: true, name: true, address: true },
    },
  });
}

  // ── Por hotel ──────────────────────────────────────────────────────────────
  findAllByHotel(hotelId: string): Promise<Restaurant[]> {
    return this.repo.find({ where: { hotelId, isActive: true } });
  }

  async findOne(id: string): Promise<Restaurant> {
    const restaurant = await this.repo.findOne({ where: { id } });
    if (!restaurant) throw new NotFoundException(`Restaurante ${id} no encontrado`);
    return restaurant;
  }

  async update(id: string, dto: UpdateRestaurantDto): Promise<Restaurant> {
    const restaurant = await this.findOne(id);
    const { location, ...rest } = dto as UpdateRestaurantDto & { location?: { lat: number; lng: number } };
    if (location) {
      const wkt = `POINT(${location.lng} ${location.lat})`;
      Object.assign(restaurant, rest, { location: wkt });
    } else {
      Object.assign(restaurant, rest);
    }
    return this.repo.save(restaurant);
  }

  async remove(id: string): Promise<void> {
    const restaurant = await this.findOne(id);
    await this.repo.remove(restaurant);
  }

  findNearby(lat: number, lng: number, radiusMeters = 5000): Promise<Restaurant[]> {
    return this.repo
      .createQueryBuilder('r')
      .where(
        `ST_DWithin(r.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)`,
        { lat, lng, radius: radiusMeters },
      )
      .andWhere('r.is_active = true')
      .getMany();
   }
}