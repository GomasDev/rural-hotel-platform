import { Repository } from 'typeorm';
import { User } from './user.entity';
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    findByEmail(email: string): Promise<User | null>;
    create(userData: Partial<User>): Promise<User>;
}
