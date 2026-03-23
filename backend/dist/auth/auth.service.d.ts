import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { MailService } from '../mail/mail.service';
export declare class AuthService {
    private usersService;
    private readonly jwtService;
    private readonly mailService;
    constructor(usersService: UsersService, jwtService: JwtService, mailService: MailService);
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
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            role: import("../users/entities/user.entity").UserRole;
        };
    }>;
    forgotPassword(email: string): Promise<void>;
    resetPassword(token: string, newPassword: string): Promise<void>;
}
