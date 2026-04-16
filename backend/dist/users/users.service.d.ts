import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Booking } from '../bookings/entities/booking.entity';
export declare class UsersService {
    private usersRepository;
    private bookingRepository;
    constructor(usersRepository: Repository<User>, bookingRepository: Repository<Booking>);
    findByEmail(email: string): Promise<User | null>;
    create(userData: Partial<User>): Promise<User>;
    findAll(): Promise<User[]>;
    findById(id: string): Promise<User>;
    updateRole(id: string, role: UserRole): Promise<User>;
    remove(id: string): Promise<{
        message: string;
    }>;
    updateResetToken(id: string, token: string, expires: Date): Promise<void>;
    findByResetToken(token: string): Promise<User | null>;
    updatePassword(id: string, hashedPassword: string): Promise<void>;
}
