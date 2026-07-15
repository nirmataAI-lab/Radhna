import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  create(data: {
    userId?: string | null;
    title: string;
    message: string;
    type?: NotificationType;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId ?? null,
        title: data.title,
        message: data.message,
        type: data.type ?? NotificationType.ORDER_UPDATE,
      },
    });
  }

  listForUser(userId: string, limit = 30) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });
  }

  async markRead(userId: string, id: string) {
    // Only allow marking your own notification
    const notif = await this.prisma.notification.findUnique({ where: { id } });
    if (!notif || notif.userId !== userId) return { updated: 0 };
    await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return { updated: 1 };
  }

  async markAllRead(userId: string) {
    const res = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: res.count };
  }
}
