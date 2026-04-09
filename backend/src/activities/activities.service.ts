import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly repo: Repository<Activity>,
  ) {}

  create(hotelId: string, dto: CreateActivityDto): Promise<Activity> {
    return this.repo.save(this.repo.create({ ...dto, hotelId }));
  }

  findAllByHotel(hotelId: string): Promise<Activity[]> {
    return this.repo.find({ where: { hotelId, isActive: true } });
  }

  findAll(): Promise<Activity[]> {
    return this.repo.find({
      where: { isActive: true },
      relations: { hotel: true },
      select: {
        id: true, name: true, description: true, category: true,
        pricePerPerson: true, durationMinutes: true, images: true, isActive: true,
        hotel: { id: true, name: true, address: true },
      },
    });
  }

  async findOne(id: string): Promise<Activity> {
    const act = await this.repo.findOne({ where: { id } });
    if (!act) throw new NotFoundException(`Actividad ${id} no encontrada`);
    return act;
  }

  async update(id: string, dto: UpdateActivityDto): Promise<Activity> {
    const act = await this.findOne(id);
    Object.assign(act, dto);
    return this.repo.save(act);
  }

  async remove(id: string): Promise<void> {
    await this.repo.remove(await this.findOne(id));
  }
}