import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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

  @Column({ default: 'user' })
  role: string;
}
