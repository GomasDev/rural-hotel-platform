import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>
    ) {}

    async findByEmail(email: string){
        return this.usersRepository.findOne({ where: { email } });
    }

    async create(userData: Partial<User>): Promise<User> {
        const user = this.usersRepository.create(userData);
        return this.usersRepository.save(user);
    }

    async findAll() {
        return this.usersRepository.find({
            select: ['id', 'name', 'lastName1', 'lastName2', 'email', 'role'] // Excluye password
        });
    }

    // Guarda el token de reset
    async updateResetToken(id: string, token: string, expires: Date): Promise<void> {
    await this.usersRepository.update(id, {
        resetPasswordToken: token,
        resetPasswordExpires: expires,
    });
    }

    // Busca usuario por token de reset
    async findByResetToken(token: string) {
    return this.usersRepository.findOne({
        where: { resetPasswordToken: token },
    });
    }

    // Actualiza password y limpia token
    async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.usersRepository.update(id, {
        passwordHash: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
    });
    }
}
