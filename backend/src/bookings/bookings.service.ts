import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
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

  // ── Por habitación (admin/superadmin) ──────────────────────────────────────
  async findByRoom(
    roomId: string,
    userId: string,
    userRole: string,
  ): Promise<Booking[]> {
    // Superadmin: acceso total
    if (userRole !== 'super_admin') {
      // Cargamos la habitación con su hotel para verificar el propietario
      const room = await this.roomRepo.findOne({
        where: { id: roomId },
        relations: { hotel: true },
      });

      if (!room) throw new NotFoundException(`Habitación ${roomId} no encontrada`);

      if (room.hotel.ownerId !== userId) {
        throw new ForbiddenException(
          'No tienes permiso para ver las reservas de esta habitación',
        );
      }
    }

    return this.bookingRepo.find({
      where: { roomId },
      relations: { room: true },
      order: { checkIn: 'ASC' },
    });
  }

  // ── Mis reservas (cliente) ─────────────────────────────────────────────────
  findByUser(userId: string): Promise<Booking[]> {
    return this.bookingRepo.find({
      where: { userId },
      relations: { room: true },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Una reserva ────────────────────────────────────────────────────────────
  async findOne(
    id: string,
    userId: string,
    userRole: string,
  ): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: { room: { hotel: true } },
    });

    if (!booking) throw new NotFoundException(`Reserva ${id} no encontrada`);

    // Superadmin: acceso total
    if (userRole === 'super_admin') return booking;

    // Admin: solo puede ver reservas de habitaciones de sus hoteles
    if (userRole === 'admin') {
      if (booking.room?.hotel?.ownerId !== userId) {
        throw new ForbiddenException('No tienes permiso para ver esta reserva');
      }
      return booking;
    }

    // Cliente: solo sus propias reservas
    if (booking.userId !== userId) throw new ForbiddenException();
    return booking;
  }

  // ── Cancelar ───────────────────────────────────────────────────────────────
  async cancel(
    id: string,
    userId: string,
    userRole: string,
  ): Promise<Booking> {
    const booking = await this.findOne(id, userId, userRole);

    if (booking.status === BookingStatus.Cancelled)
      throw new BadRequestException('La reserva ya está cancelada');

    booking.status = BookingStatus.Cancelled;
    return this.bookingRepo.save(booking);
  }


  async confirm(id: string, userId: string, userRole: string): Promise<Booking> {
  if (userRole === 'client')
    throw new ForbiddenException('Los clientes no pueden confirmar reservas');

  const booking = await this.findOne(id, userId, userRole);

  if (booking.status !== BookingStatus.Pending)
    throw new BadRequestException('Solo se pueden confirmar reservas en estado pendiente');

  booking.status = BookingStatus.Confirmed;
  return this.bookingRepo.save(booking);
}

async complete(id: string, userId: string, userRole: string): Promise<Booking> {
  if (userRole === 'client')
    throw new ForbiddenException('Los clientes no pueden completar reservas');

  const booking = await this.findOne(id, userId, userRole);

  if (booking.status !== BookingStatus.Confirmed)
    throw new BadRequestException('Solo se pueden completar reservas confirmadas');

  booking.status = BookingStatus.Completed;
  return this.bookingRepo.save(booking);
}
}