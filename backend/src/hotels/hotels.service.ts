import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hotel } from '../hotels/entities/hotel.entity';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';

@Injectable()
export class HotelsService {
  constructor(
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
  ) {}

  async create(dto: CreateHotelDto, ownerId: string): Promise<Hotel> {
    const { location, ...rest } = dto;
    const [lng, lat] = location.split(',').map(Number);

    const result = await this.hotelRepository
      .createQueryBuilder()
      .insert()
      .into(Hotel)
      .values({
        ...rest,
        ownerId,
        location: () => `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`,
      })
      .returning('*')
      .execute();

    return result.generatedMaps[0] as Hotel;
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    order?: string;
  }) {
    const {
      page = 1,
      limit = 9,
      search = '',
      sortBy = 'createdAt',
      order = 'DESC',
    } = params;

    const skip = (page - 1) * limit;

    const allowedSortFields: Record<string, string> = {
      createdAt: 'hotel.createdAt',
      name: 'hotel.name',
      address: 'hotel.address',
    };

    const sortField = allowedSortFields[sortBy] ?? 'hotel.createdAt';
    const sortOrder: 'ASC' | 'DESC' =
      order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.hotelRepository
      .createQueryBuilder('hotel')
      .leftJoinAndSelect('hotel.owner', 'owner')
      .where('hotel.isActive = true');

    if (search) {
      qb.andWhere(
        '(LOWER(hotel.name) LIKE :s OR LOWER(hotel.address) LIKE :s)',
        { s: `%${search.toLowerCase()}%` },
      );
    }

    //  Paginamos SIN rooms (evita el bug de TypeORM con skip/take)
    const [data, total] = await qb
      .orderBy(sortField, sortOrder)
      .addOrderBy('hotel.id', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    //  Cargamos rooms solo para los hoteles de esta página
    const ids = data.map(h => h.id);
    if (ids.length > 0) {
      const hotelsWithRooms = await this.hotelRepository
        .createQueryBuilder('hotel')
        .leftJoinAndSelect('hotel.rooms', 'rooms')
        .where('hotel.id IN (:...ids)', { ids })
        .getMany();

      // Mapeamos las rooms al resultado paginado manteniendo el orden
      const roomsMap = new Map(hotelsWithRooms.map(h => [h.id, h.rooms]));
      data.forEach(h => { h.rooms = roomsMap.get(h.id) ?? []; });
    }

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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

  async findNearby(
    lng: number,
    lat: number,
    radiusKm: number,
  ): Promise<Hotel[]> {
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