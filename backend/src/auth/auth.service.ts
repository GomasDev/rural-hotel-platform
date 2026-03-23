import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService, 
        private readonly jwtService: JwtService,
        private readonly mailService: MailService,
    ) {}
    
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

    //POST /auth/forgot-password
    async forgotPassword(email: string): Promise<void> {
        const user = await this.usersService.findByEmail(email);
        if (!user) return; // No revela si el email existe

        const token = randomBytes(32).toString('hex');
        const expires = new Date();
        expires.setHours(expires.getHours() + 1); // 1 hora

        // ← usersService en lugar de usersRepository
        await this.usersService.updateResetToken(user.id, token, expires);

        await this.mailService.sendPasswordReset(email, token);
    }

    //POST /auth/reset-password
    async resetPassword(token: string, newPassword: string): Promise<void> {

        const user = await this.usersService.findByResetToken(token);

        if (!user) {
        throw new BadRequestException('Token inválido');
        }

        if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
        throw new BadRequestException('El token ha expirado');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.usersService.updatePassword(user.id, hashedPassword);
    }

}
