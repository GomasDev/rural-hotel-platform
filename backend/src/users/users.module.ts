// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],  // ← Repository injection
  providers: [UsersService],
  exports: [UsersService],  // ← AuthModule lo usa
})
export class UsersModule {}
