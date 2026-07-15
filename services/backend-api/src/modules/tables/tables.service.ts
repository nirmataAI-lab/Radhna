import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TablesService {
  private readonly customerAppUrl: string;

  constructor(private prisma: PrismaService) {
    this.customerAppUrl =
      process.env.CUSTOMER_APP_URL || 'http://localhost:3001';
  }

  async findAll() {
    return this.prisma.table.findMany({
      orderBy: { tableNumber: 'asc' },
      include: {
        _count: { select: { orders: true } },
      },
    });
  }

  async findOne(id: string) {
    const table = await this.prisma.table.findUnique({ where: { id } });
    if (!table) throw new NotFoundException(`Table ${id} not found`);
    return table;
  }

  async create(data: { tableNumber: string; capacity: number }) {
    return this.prisma.table.create({
      data: {
        tableNumber: data.tableNumber,
        capacity: data.capacity,
        qrCode: `${this.customerAppUrl}/menu?table=${data.tableNumber}`,
      },
    });
  }

  async update(id: string, data: { tableNumber?: string; capacity?: number }) {
    await this.findOne(id);
    const updateData: any = { ...data };
    if (data.tableNumber) {
      updateData.qrCode = `${this.customerAppUrl}/menu?table=${data.tableNumber}`;
    }
    return this.prisma.table.update({ where: { id }, data: updateData });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.table.delete({ where: { id } });
  }

  async getQrCodeUrl(id: string) {
    const table = await this.findOne(id);
    return (
      table.qrCode || `${this.customerAppUrl}/menu?table=${table.tableNumber}`
    );
  }
}
