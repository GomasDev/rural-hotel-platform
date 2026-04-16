import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
  ) {}

  async findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email, deletedAt: IsNull() },
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async findAll() {
    return this.usersRepository.find({
      where: { deletedAt: IsNull() },
      select: ['id', 'name', 'lastName1', 'lastName2', 'email', 'role'],
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!user) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }

    return user;
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findById(id);
    user.role = role;
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.findById(id);

    await this.bookingRepository
      .createQueryBuilder()
      .update(Booking)
      .set({ status: BookingStatus.Cancelled })
      .where('user_id = :id', { id: user.id })
      .andWhere('status IN (:...statuses)', {
        statuses: [BookingStatus.Pending, BookingStatus.Confirmed],
      })
      .execute();

    await this.usersRepository.update(user.id, {
      deletedAt: new Date(),
    });

    return {
      message: `Usuario ${id} marcado como eliminado correctamente`,
    };
  }

  async updateResetToken(id: string, token: string, expires: Date): Promise<void> {
    await this.usersRepository.update(id, {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });
  }

  async findByResetToken(token: string) {
    return this.usersRepository.findOne({
      where: { resetPasswordToken: token, deletedAt: IsNull() },
    });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.usersRepository.update(id, {
      passwordHash: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
  }
}