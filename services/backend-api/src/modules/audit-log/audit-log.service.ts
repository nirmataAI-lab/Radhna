import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/pagination.dto';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    adminId: string;
    action: string;
    entity: string;
    entityId: string;
    reason?: string;
  }) {
    return this.prisma.auditLog.create({ data });
  }

  async findAll(page: number = 1, limit: number = 50) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        include: { admin: { select: { id: true, name: true, email: true } } },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count(),
    ]);
    return paginate(data, total, page, limit);
  }
}
