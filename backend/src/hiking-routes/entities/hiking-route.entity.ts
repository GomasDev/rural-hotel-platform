import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Hotel } from '../../hotels/entities/hotel.entity';

export enum Difficulty {
  LOW    = 'low',
  MEDIUM = 'medium',
  HIGH   = 'high',
}

@Entity('hiking_routes')
export class HikingRoute {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'hotel_id' })
  hotelId!: string;

  @ManyToOne(() => Hotel, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'hotel_id' })
  hotel!: Hotel;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'enum', enum: Difficulty })
  difficulty!: Difficulty;

  @Column({ name: 'distance_km', type: 'decimal', precision: 6, scale: 2 })
  distanceKm!: number;

  @Column({ name: 'elevation_gain_m', type: 'int', nullable: true })
  elevationGainM?: number | null;

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes?: number | null;

  // string, NO object
  @Column({
    name: 'route_geom',
    type: 'geometry',
    spatialFeatureType: 'LineString',
    srid: 4326,
    nullable: false,
  })
  routeGeom!: string;

  @Column({ name: 'gpx_file_url', type: 'varchar', length: 255, nullable: true })
  gpxFileUrl?: string | null;

  @Column({ type: 'text', array: true, nullable: true, default: '{}' })
  images?: string[] | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}