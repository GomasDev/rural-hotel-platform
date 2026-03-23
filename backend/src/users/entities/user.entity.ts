import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type UserRole = 'super_admin' | 'admin' | 'client';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({name: 'last_name1'})
  lastName1: string;

  @Column({name: 'last_name2', nullable: true})
  lastName2: string;

  @Column({ unique: true })
  email: string;

  @Column({name: 'password_hash'})
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: ['super_admin', 'admin', 'client'],
    default: 'client',
  })
  role: UserRole;



  
}
