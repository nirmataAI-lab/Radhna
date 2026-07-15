import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('seed-admin')
  seedAdmin() {
    return this.usersService.createUser({
      email: 'admin@restaurant.com',
      password: 'password123',
      name: 'Restaurant Admin',
      role: 'SUPER_ADMIN',
    });
  }
}
