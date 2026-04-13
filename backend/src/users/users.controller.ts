import { Controller, Get, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import type { UserRole } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('superadmin' as UserRole)
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id/role')
  @Roles('superadmin' as UserRole)
  updateRole(
    @Param('id') id: string,
    @Body('role') role: string,
  ) {
    return this.usersService.updateRole(id, role as UserRole);
  }

  @Delete(':id')
  @Roles('superadmin' as UserRole)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}