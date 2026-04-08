import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Hotel } from '../../hotels/entities/hotel.entity';

export enum PriceRange {
  LOW    = '€',
  MEDIUM = '€€',
  HIGH   = '€€€',
}

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'hotel_id' })
  hotelId: string;

  @ManyToOne(() => Hotel, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // ✅ string, NO object — TypeORM recibe/entrega WKT o GeoJSON como string
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: false,
  })
  location: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string | null;

  @Column({ name: 'cuisine_type', type: 'varchar', length: 100, nullable: true })
  cuisineType: string | null;

  @Column({
    name: 'price_range',
    type: 'enum',
    enum: PriceRange,
    nullable: true,
  })
  priceRange: PriceRange | null;

  @Column({ type: 'decimal', precision: 2, scale: 1, nullable: true })
  rating: number | null;

  @Column({ type: 'text', array: true, nullable: true, default: '{}' })
  images: string[] | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}