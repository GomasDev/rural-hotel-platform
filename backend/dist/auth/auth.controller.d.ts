import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
