import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req,
  BadRequestException, ForbiddenException, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CreateStaffDto, UpdateStaffDto } from './dto/staff.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import type { Request } from 'express';

const STAFF_ROLES: Role[] = [Role.SUPER_ADMIN, Role.CHIEF];

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Post('seed-admin')
  seedAdmin() {
    return this.usersService.createUser({
      email: 'admin@restaurant.com',
      password: 'password123',
      name: 'Restaurant Admin',
      role: 'SUPER_ADMIN',
    });
  }

  // ─── Staff (admins & chefs) ────────────────────────

  @Get('staff')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List staff (SUPER_ADMIN + CHIEF)' })
  async listStaff() {
    return this.prisma.user.findMany({
      where: { role: { in: STAFF_ROLES } },
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, status: true, createdAt: true, updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('staff')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a staff member' })
  async createStaff(@Body() dto: CreateStaffDto, @Req() req: Request) {
    if (!STAFF_ROLES.includes(dto.role)) {
      throw new BadRequestException('Role must be SUPER_ADMIN or CHIEF');
    }
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, ...(dto.phone ? [{ phone: dto.phone }] : [])] },
    });
    if (existing) throw new BadRequestException('Email or phone already in use');

    const user = await this.usersService.createUser(dto);
    await this.auditLog.log({
      adminId: (req.user as any).id,
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      reason: `Created ${dto.role} ${dto.email}`,
    });
    const { passwordHash: _ph, ...safe } = user as any;
    return safe;
  }

  @Patch('staff/:id')
  @ApiOperation({ summary: 'Update a staff member' })
  async updateStaff(@Param('id') id: string, @Body() dto: UpdateStaffDto, @Req() req: Request) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Staff member not found');
    if (!STAFF_ROLES.includes(target.role)) {
      throw new BadRequestException('Only SUPER_ADMIN or CHIEF users can be edited here');
    }
    const actorId = (req.user as any).id;
    if (target.id === actorId && dto.role && dto.role !== target.role) {
      throw new ForbiddenException('You cannot change your own role');
    }
    if (target.id === actorId && dto.status === 'SUSPENDED') {
      throw new ForbiddenException('You cannot suspend your own account');
    }
    if (dto.role && !STAFF_ROLES.includes(dto.role)) {
      throw new BadRequestException('Role must be SUPER_ADMIN or CHIEF');
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, status: true, createdAt: true, updatedAt: true,
      },
    });
    await this.auditLog.log({
      adminId: actorId,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      reason: `Updated ${Object.keys(data).join(', ') || 'no fields'}`,
    });
    return user;
  }

  @Delete('staff/:id')
  @ApiOperation({ summary: 'Delete a staff member' })
  async deleteStaff(@Param('id') id: string, @Req() req: Request) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Staff member not found');
    if (!STAFF_ROLES.includes(target.role)) {
      throw new BadRequestException('Only staff can be deleted here');
    }
    const actorId = (req.user as any).id;
    if (target.id === actorId) throw new ForbiddenException('You cannot delete your own account');

    if (target.role === Role.SUPER_ADMIN) {
      const remainingAdmins = await this.prisma.user.count({
        where: { role: Role.SUPER_ADMIN, id: { not: id } },
      });
      if (remainingAdmins === 0) {
        throw new BadRequestException('Cannot delete the last SUPER_ADMIN');
      }
    }

    await this.prisma.user.delete({ where: { id } });
    await this.auditLog.log({
      adminId: actorId,
      action: 'DELETE',
      entity: 'User',
      entityId: id,
      reason: `Deleted ${target.role} ${target.email ?? target.id}`,
    });
    return { success: true };
  }
}
