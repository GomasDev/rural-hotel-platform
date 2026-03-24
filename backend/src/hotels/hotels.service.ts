import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hotel } from './entities/hotel.entity';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';

@Injectable()
export class HotelsService {
  constructor(
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
  ) {}

  async create(dto: CreateHotelDto): Promise<Hotel> {
    const { location, ...rest } = dto;
    const [lng, lat] = location.split(',').map(Number);

    //QueryBuilder para PostGIS (create() no acepta funciones SQL)
    const result = await this.hotelRepository
      .createQueryBuilder()
      .insert()
      .into(Hotel)
      .values({
        ...rest,
        location: () => `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`,
      })
      .returning('*')
      .execute();

    return result.generatedMaps[0] as Hotel;
  }

  async findAll(): Promise<Hotel[]> {
    return this.hotelRepository.find({
      where: { isActive: true },
      relations: ['owner', 'rooms'],
    });
  }

  async findOne(id: string): Promise<Hotel> {
    const hotel = await this.hotelRepository.findOne({
      where: { id },
      relations: ['owner', 'rooms'],
    });
    if (!hotel) throw new NotFoundException(`Hotel ${id} no encontrado`);
    return hotel;
  }

  async update(id: string, dto: UpdateHotelDto): Promise<Hotel> {
    const { location, ...rest } = dto;

    if (location) {
      //Si hay location → QueryBuilder también
      const [lng, lat] = location.split(',').map(Number);
      await this.hotelRepository
        .createQueryBuilder()
        .update(Hotel)
        .set({
          ...rest,
          location: () => `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`,
        })
        .where('id = :id', { id })
        .execute();
    } else {
      // Sin location → save() normal
      const hotel = await this.findOne(id);
      Object.assign(hotel, rest);
      await this.hotelRepository.save(hotel);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const hotel = await this.findOne(id);
    await this.hotelRepository.remove(hotel);
    return { message: `Hotel ${id} eliminado correctamente` };
  }

  async findNearby(lng: number, lat: number, radiusKm: number): Promise<Hotel[]> {
    return this.hotelRepository
      .createQueryBuilder('hotel')
      .where(
        `ST_DWithin(hotel.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)`,
        { lng, lat, radius: radiusKm * 1000 },
      )
      .andWhere('hotel.is_active = true')
      .getMany();
  }
}
