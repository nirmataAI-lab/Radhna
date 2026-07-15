import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/pagination.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, page: number = 1, limit: number = 20) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { supplierReference: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await this.prisma.$transaction([
      this.prisma.inventoryRawMaterial.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.inventoryRawMaterial.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const item = await this.prisma.inventoryRawMaterial.findUnique({
      where: { id },
    });
    if (!item) throw new NotFoundException(`Inventory item ${id} not found`);
    return item;
  }

  async create(data: {
    name: string;
    unit: string;
    quantity: number;
    lowStockThreshold: number;
    supplierReference?: string;
  }) {
    return this.prisma.inventoryRawMaterial.create({
      data: {
        name: data.name,
        unit: data.unit,
        quantity: data.quantity,
        lowStockThreshold: data.lowStockThreshold,
        supplierReference: data.supplierReference,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      unit?: string;
      quantity?: number;
      lowStockThreshold?: number;
      supplierReference?: string;
    },
  ) {
    await this.findOne(id);
    return this.prisma.inventoryRawMaterial.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.inventoryRawMaterial.delete({ where: { id } });
  }

  async getAlerts() {
    const all = await this.prisma.inventoryRawMaterial.findMany();
    const outOfStock = all.filter((item) => item.quantity.toNumber() <= 0);
    const lowStock = all.filter(
      (item) =>
        item.quantity.toNumber() > 0 &&
        item.quantity.toNumber() <= item.lowStockThreshold.toNumber(),
    );
    return { outOfStock, lowStock };
  }
}
