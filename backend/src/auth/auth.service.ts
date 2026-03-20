import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';


//POST /auth/register
@Injectable()
export class AuthService {
    constructor(private usersService: UsersService) {}

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
}
