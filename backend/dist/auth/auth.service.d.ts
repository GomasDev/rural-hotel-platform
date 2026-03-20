import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private usersService;
    constructor(usersService: UsersService);
    register(registerDto: RegisterDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            email: string;
            name: string;
            last_name1: string;
            last_name2: string;
        };
    }>;
}
