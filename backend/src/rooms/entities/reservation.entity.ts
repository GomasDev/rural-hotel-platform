// entities/booking.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Room } from './room.entity';
import { User } from '../../users/entities/user.entity';

export enum BookingStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
  Completed = 'completed',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => Room, { nullable: false })
  @JoinColumn({ name: 'room_id' })
  room!: Room;

  @Column({ name: 'room_id' })
  roomId!: string;

  @Column({ name: 'check_in', type: 'date' })
  checkIn!: Date;

  @Column({ name: 'check_out', type: 'date' })
  checkOut!: Date;

  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2 })
  totalPrice!: number;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.Pending })
  status!: BookingStatus;

  @Column({ name: 'stripe_payment_id', type: 'varchar', length: 255, nullable: true })
  stripePaymentId?: string;

  @Column({ type: 'int' })
  guests!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
