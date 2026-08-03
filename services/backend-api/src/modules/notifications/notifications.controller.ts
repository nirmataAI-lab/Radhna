import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, NotificationType } from '@prisma/client';
import type { Request } from 'express';

class BroadcastDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}

@ApiTags('notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get('my')
  @ApiOperation({ summary: 'List my notifications (most recent first)' })
  @ApiQuery({ name: 'limit', required: false })
  list(@Req() req: Request, @Query('limit') limit?: string) {
    const userId = (req as any).user?.userId as string;
    return this.service.listForUser(userId, limit ? parseInt(limit, 10) : 30);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user?.userId as string;
    return this.service.markRead(userId, id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  markAllRead(@Req() req: Request) {
    const userId = (req as any).user?.userId as string;
    return this.service.markAllRead(userId);
  }

  @Post('broadcast')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Broadcast a notification to system/all users (Admin only)' })
  broadcast(@Body() dto: BroadcastDto) {
    return this.service.create({
      title: dto.title,
      message: dto.message,
      type: dto.type,
    });
  }
}
