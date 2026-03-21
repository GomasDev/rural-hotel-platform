// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  imports: [TypeOrmModule.forFeature([User])],  // ← Repository injection
  providers: [UsersService],
  exports: [UsersService],  // ← AuthModule lo usa
})
export class UsersModule {}
