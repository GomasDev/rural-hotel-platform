import {
  Entity, Column, PrimaryGeneratedColumn,
  ManyToOne, JoinColumn, CreateDateColumn, OneToMany
} from 'typeorm';
import { Hotel } from '../../hotels/entities/hotel.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Hotel, (hotel) => hotel.rooms, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'hotel_id' })
  hotel!: Hotel;

  @Column({ name: 'hotel_id' })
  hotelId!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int' })
  capacity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'price_per_night' })
  pricePerNight!: number;

  @Column({ type: 'text', array: true, nullable: true })
  images?: string[];

  @Column({ name: 'is_available', type: 'boolean', default: true })
  isAvailable!: boolean;

  @OneToMany(() => Booking, booking => booking.room)
  bookings!: Booking[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
