import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Room } from '../rooms/entities/room.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Room)    private readonly roomRepo:    Repository<Room>,
    private readonly mailService: MailService,
  ) {}

  // ── Crear reserva ──────────────────────────────────────────────────────────
  async create(userId: string, dto: CreateBookingDto): Promise<Booking> {
    const room = await this.roomRepo.findOne({
      where: { id: dto.roomId },
      relations: { hotel: true },    // ← necesario para hotelName en el email
    });
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
      guests:     dto.guests,
      totalPrice,
      status: BookingStatus.Pending,
    });

    const saved = await this.bookingRepo.save(booking);

    // ── Email al admin ────────────────────────────────────────────────────────
    // El guest no está en booking todavía sin relación; usamos guestEmail del DTO
    // o cargamos user. Como los datos del cliente están en el contexto del controller,
    // usamos lo que tenemos y admin vía env.
    this.mailService.sendNewBookingToAdmin({
      bookingId:   saved.id,
      guestName:   dto.guestName   ?? 'Cliente',
      guestEmail:  dto.guestEmail  ?? '',
      adminName:   process.env.ADMIN_NAME  ?? 'Administrador',
      adminEmail:  process.env.ADMIN_EMAIL ?? '',
      hotelName:   room.hotel?.name ?? 'Hotel',
      roomName:    room.name,
      checkIn:     dto.checkIn,
      checkOut:    dto.checkOut,
      nights,
      guests:      dto.guests,
      totalPrice,
    }).catch(() => {}); // fire-and-forget, no bloquea la respuesta

    return saved;
  }

  // ── Por habitación (admin/superadmin) ──────────────────────────────────────
  async findByRoom(roomId: string, userId: string, userRole: string): Promise<Booking[]> {
    if (userRole !== 'super_admin') {
      const room = await this.roomRepo.findOne({
        where: { id: roomId },
        relations: { hotel: true },
      });

      if (!room) throw new NotFoundException(`Habitación ${roomId} no encontrada`);

      if (room.hotel.ownerId !== userId) {
        throw new ForbiddenException('No tienes permiso para ver las reservas de esta habitación');
      }
    }

    return this.bookingRepo.find({
      where:     { roomId },
      relations: { room: true },
      order:     { checkIn: 'ASC' },
    });
  }

  // ── Mis reservas (cliente) ─────────────────────────────────────────────────
  findByUser(userId: string): Promise<Booking[]> {
    return this.bookingRepo.find({
      where:     { userId },
      relations: { room: true },
      order:     { createdAt: 'DESC' },
    });
  }

  // ── Una reserva ────────────────────────────────────────────────────────────
  async findOne(id: string, userId: string, userRole: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where:     { id },
      relations: { room: { hotel: true }, user: true }, // ← user para emails
    });

    if (!booking) throw new NotFoundException(`Reserva ${id} no encontrada`);

    if (userRole === 'super_admin') return booking;

    if (userRole === 'admin') {
      if (booking.room?.hotel?.ownerId !== userId) {
        throw new ForbiddenException('No tienes permiso para ver esta reserva');
      }
      return booking;
    }

    if (booking.userId !== userId) throw new ForbiddenException();
    return booking;
  }

  // ── Cancelar ───────────────────────────────────────────────────────────────
  async cancel(id: string, userId: string, userRole: string): Promise<Booking> {
    const booking = await this.findOne(id, userId, userRole);

    if (booking.status === BookingStatus.Cancelled)
      throw new BadRequestException('La reserva ya está cancelada');

    booking.status = BookingStatus.Cancelled;
    const saved = await this.bookingRepo.save(booking);

    // ── Email al cliente ───────────────────────────────────────────────────────
    const nights = Math.ceil(
      (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86_400_000,
    );

    this.mailService.sendBookingCancelledToClient({
      bookingId:  saved.id,
      guestName:  `${booking.user?.name ?? ''} ${booking.user?.lastName1 ?? ''}`.trim(),
      guestEmail: booking.user?.email ?? '',
      adminName:  process.env.ADMIN_NAME  ?? 'Administrador',
      adminEmail: process.env.ADMIN_EMAIL ?? '',
      hotelName:  booking.room?.hotel?.name ?? 'Hotel',
      roomName:   booking.room?.name ?? '',
      checkIn:    booking.checkIn.toString(),
      checkOut:   booking.checkOut.toString(),
      nights,
      guests:     booking.guests,
      totalPrice: parseFloat(booking.totalPrice as unknown as string),
    }).catch(() => {});

    return saved;
  }

  // ── Confirmar ─────────────────────────────────────────────────────────────
  async confirm(id: string, userId: string, userRole: string): Promise<Booking> {
    if (userRole === 'client')
      throw new ForbiddenException('Los clientes no pueden confirmar reservas');

    const booking = await this.findOne(id, userId, userRole);

    if (booking.status !== BookingStatus.Pending)
      throw new BadRequestException('Solo se pueden confirmar reservas en estado pendiente');

    booking.status = BookingStatus.Confirmed;
    const saved = await this.bookingRepo.save(booking);

    // ── Email al cliente ───────────────────────────────────────────────────────
    const nights = Math.ceil(
      (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86_400_000,
    );

    this.mailService.sendBookingConfirmedToClient({
      bookingId:  saved.id,
      guestName:  `${booking.user?.name ?? ''} ${booking.user?.lastName1 ?? ''}`.trim(),
      guestEmail: booking.user?.email ?? '',
      adminName:  process.env.ADMIN_NAME  ?? 'Administrador',
      adminEmail: process.env.ADMIN_EMAIL ?? '',
      hotelName:  booking.room?.hotel?.name ?? 'Hotel',
      roomName:   booking.room?.name ?? '',
      checkIn:    booking.checkIn.toString(),
      checkOut:   booking.checkOut.toString(),
      nights,
      guests:     booking.guests,
      totalPrice: parseFloat(booking.totalPrice as unknown as string),
    }).catch(() => {});

    return saved;
  }

  // ── Completar ─────────────────────────────────────────────────────────────
  async complete(id: string, userId: string, userRole: string): Promise<Booking> {
    if (userRole === 'client')
      throw new ForbiddenException('Los clientes no pueden completar reservas');

    const booking = await this.findOne(id, userId, userRole);

    if (booking.status !== BookingStatus.Confirmed)
      throw new BadRequestException('Solo se pueden completar reservas confirmadas');

    booking.status = BookingStatus.Completed;
    return this.bookingRepo.save(booking);
  }

  async findAll(userId: string, userRole: string): Promise<Booking[]> {
    if (userRole === 'super_admin') {
      return this.bookingRepo.find({
        relations: { room: { hotel: true }, user: true },
        order: { createdAt: 'DESC' },
      });
    }

    if (userRole === 'admin') {
      return this.bookingRepo
        .createQueryBuilder('b')
        .leftJoinAndSelect('b.room', 'room')
        .leftJoinAndSelect('room.hotel', 'hotel')
        .leftJoinAndSelect('b.user', 'user')
        .where('hotel.ownerId = :userId', { userId })
        .orderBy('b.createdAt', 'DESC')
        .getMany();
    }

    // fallback cliente
    return this.bookingRepo.find({
      where: { userId },
      relations: { room: { hotel: true } },
      order: { createdAt: 'DESC' },
    });
  }
}