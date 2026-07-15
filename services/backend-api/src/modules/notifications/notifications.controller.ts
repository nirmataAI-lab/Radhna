import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';

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
}
