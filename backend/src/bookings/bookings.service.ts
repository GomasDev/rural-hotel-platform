import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../rooms/entities/booking.entity';
import { Room } from '../rooms/entities/room.entity';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Room)    private readonly roomRepo:    Repository<Room>,
  ) {}

  // ── Crear reserva ──────────────────────────────────────────────────────────
  async create(userId: string, dto: CreateBookingDto): Promise<Booking> {
    const room = await this.roomRepo.findOne({ where: { id: dto.roomId } });
    if (!room) throw new NotFoundException(`Habitación ${dto.roomId} no encontrada`);
    if (!room.isAvailable) throw new BadRequestException('La habitación no está disponible');

    const checkIn  = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);

    if (checkOut <= checkIn)
      throw new BadRequestException('La fecha de salida debe ser posterior a la de entrada');

    // Comprobar solapamiento con otras reservas activas
    const overlap = await this.bookingRepo
      .createQueryBuilder('b')
      .where('b.room_id = :roomId', { roomId: dto.roomId })
      .andWhere('b.status NOT IN (:...cancelled)', { cancelled: [BookingStatus.Cancelled] })
      .andWhere('b.check_in  < :checkOut', { checkOut: dto.checkOut })
      .andWhere('b.check_out > :checkIn',  { checkIn:  dto.checkIn  })
      .getOne();

    if (overlap) throw new BadRequestException('La habitación ya está reservada en esas fechas');

    const nights     = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86_400_000);
    const totalPrice = parseFloat(room.pricePerNight as unknown as string) * nights;

    const booking = this.bookingRepo.create({
      userId,
      roomId: dto.roomId,
      checkIn,
      checkOut,
      guests: dto.guests,
      totalPrice,
      status: BookingStatus.Pending,
    });

    return this.bookingRepo.save(booking);
  }

  // ── Por habitación (admin) ─────────────────────────────────────────────────
    findByRoom(roomId: string): Promise<Booking[]> {
    return this.bookingRepo.find({
        where: { roomId },
        relations: { room: true },
        order: { checkIn: 'ASC' },
    });
    }

  // ── Mis reservas ───────────────────────────────────────────────────────────
  findByUser(userId: string): Promise<Booking[]> {
    return this.bookingRepo.find({
      where: { userId },
      relations: { room: true },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Una reserva ────────────────────────────────────────────────────────────
  async findOne(id: string, userId: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: { room: true },
    });
    if (!booking)       throw new NotFoundException(`Reserva ${id} no encontrada`);
    if (booking.userId !== userId) throw new ForbiddenException();
    return booking;
  }

  // ── Cancelar ───────────────────────────────────────────────────────────────
  async cancel(id: string, userId: string): Promise<Booking> {
    const booking = await this.findOne(id, userId);
    if (booking.status === BookingStatus.Cancelled)
      throw new BadRequestException('La reserva ya está cancelada');
    booking.status = BookingStatus.Cancelled;
    return this.bookingRepo.save(booking);
  }
}