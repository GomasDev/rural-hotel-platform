import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';


@Injectable()
export class AuthService {
    constructor(private usersService: UsersService, private readonly jwtService: JwtService) {}
    
    //POST /auth/register
    async register(registerDto: RegisterDto) {
        const { name, lastName1, lastName2, email, password, role } = registerDto;
        
        //check if email already exists
        const existingUser = await this.usersService.findByEmail(email);
        if (existingUser) {
            throw new BadRequestException('Email ya registrado');
        }

        //hash password
        const saltOrRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltOrRounds);

        //create user
        const user = await this.usersService.create({
            name,
            lastName1,
            lastName2,
            email,
            passwordHash: hashedPassword,
            role: role || 'client', // Default to 'customer' if no role provided
        });

        return {
            statusCode: 201,
            message: 'Usuario registrado correctamente',
            data: { 
                id: user.id, 
                email: user.email, 
                name: user.name,
                last_name1: user.lastName1,
                last_name2: user.lastName2,
            }
        };
    }    

    //POST /auth/login
    async login(loginDto: LoginDto) {
        const user = await this.usersService.findByEmail(loginDto.email);
        if (!user) throw new UnauthorizedException('Credenciales incorrectas');

        const valid = await bcrypt.compare(loginDto.password, user.passwordHash);
        if (!valid) throw new UnauthorizedException('Credenciales incorrectas');

        const payload = { sub: user.id, email: user.email, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: { id: user.id, email: user.email, role: user.role }
        };
    }

}
