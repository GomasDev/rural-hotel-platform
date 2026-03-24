import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room-dto';
import { Booking, BookingStatus } from './entities/reservation.entity';
import { AvailableRoomDto } from './dto/available-room.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>, 
  ) {}



  async create(dto: CreateRoomDto): Promise<Room> {
    const room = this.roomRepository.create(dto);
    return this.roomRepository.save(room);
  }

  async findAll(): Promise<Room[]> {
    return this.roomRepository.find({
      relations: ['hotel'],
    });
  }

  async findByHotel(hotelId: string): Promise<Room[]> {
    return this.roomRepository.find({
      where: { hotelId },
      relations: ['hotel'],
    });
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['hotel'],
    });
    if (!room) throw new NotFoundException(`Habitación ${id} no encontrada`);
    return room;
  }

  async update(id: string, dto: UpdateRoomDto): Promise<Room> {
    const room = await this.findOne(id);
    Object.assign(room, dto);
    return this.roomRepository.save(room);
  }

  async remove(id: string): Promise<{ message: string }> {
    const room = await this.findOne(id);
    await this.roomRepository.remove(room);
    return { message: `Habitación ${id} eliminada correctamente` };
  }

  // Para S2-05 → disponibilidad por fechas (anti-overbooking)
  async findAvailable(
    hotelId: string,
    checkIn: string,
    checkOut: string,
  ): Promise<AvailableRoomDto[]> {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const rooms = await this.roomRepository
      .createQueryBuilder('room')
      .leftJoin('room.bookings', 'res')  // ✅ Simplificado SIN Brackets complejos
      .where('room.hotelId = :hotelId', { hotelId })
      .andWhere('(res.id IS NULL OR res.status = :cancelled OR res.checkOut < :checkIn OR res.checkIn > :checkOut)', {
        cancelled: 'cancelled',
        checkIn: checkInDate,
        checkOut: checkOutDate,
      })
      .getMany();

    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));
    return rooms.map(room => ({
      id: room.id, name: room.name, capacity: room.capacity,
      pricePerNight: room.pricePerNight, totalPrice: room.pricePerNight * nights,
      availableNights: nights,
    }));
  }
  async getBookingStatus(bookingId: string): Promise<string> {
    const booking = await this.bookingRepository.findOne({  
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking.status;
  }

  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
  ): Promise<string> {
    const booking = await this.bookingRepository.findOne({ 
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    booking.status = status;
    await this.bookingRepository.save(booking);  

    if (status === BookingStatus.Cancelled) {
      const room = await this.roomRepository.findOne({
        where: { id: booking.roomId },
      });
      if (room) {
        room.isAvailable = true;
        await this.roomRepository.save(room); 
      }
    }
    return booking.status;
  }
}