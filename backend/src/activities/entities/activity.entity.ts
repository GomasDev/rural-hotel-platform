import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Hotel } from '../../hotels/entities/hotel.entity';

export enum ActivityCategory {
  ADVENTURE   = 'adventure',
  WATER       = 'water',
  CULTURE     = 'culture',
  GASTRONOMY  = 'gastronomy',
  WELLNESS    = 'wellness',
  OTHER       = 'other',
}

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ name: 'hotel_id' }) hotelId!: string;

  @ManyToOne(() => Hotel, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'hotel_id' }) hotel!: Hotel;

  @Column({ type: 'varchar', length: 150 }) name!: string;

  @Column({ type: 'text', nullable: true }) description!: string | null;

  @Column({ type: 'enum', enum: ActivityCategory, default: ActivityCategory.OTHER })
  category!: ActivityCategory;

  @Column({ name: 'price_per_person', type: 'decimal', precision: 8, scale: 2, nullable: true })
  pricePerPerson!: number | null;

  @Column({ name: 'max_participants', type: 'int', nullable: true })
  maxParticipants!: number | null;

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes!: number | null;

  @Column({ type: 'text', array: true, nullable: true, default: '{}' })
  images!: string[] | null;

  @Column({ name: 'is_active', type: 'boolean', default: true }) isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}