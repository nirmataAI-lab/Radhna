import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/create-category.dto';
import {
  CreateFoodItemDto,
  UpdateFoodItemDto,
} from './dto/create-food-item.dto';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  // ─── Categories ────────────────────────────────────

  async getCategories() {
    return this.prisma.category.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getCategory(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { foodItems: true },
    });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        name: dto.name,
        image: dto.image,
        displayOrder: dto.displayOrder ?? 0,
      },
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    await this.getCategory(id);
    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCategory(id: string) {
    const category = await this.getCategory(id);
    const itemCount = await this.prisma.foodItem.count({
      where: { categoryId: id },
    });
    if (itemCount > 0) {
      throw new BadRequestException(
        `Cannot delete category "${category.name}" — it has ${itemCount} food item(s). Remove or reassign them first.`,
      );
    }
    return this.prisma.category.delete({ where: { id } });
  }

  // ─── Food Items ────────────────────────────────────

  private async enrichWithRating(items: any[]) {
    if (items.length === 0) return items;
    const foodItemIds = items.map((i) => i.id);
    const aggregates = await this.prisma.review.groupBy({
      by: ['foodItemId'],
      where: { foodItemId: { in: foodItemIds } },
      _avg: { rating: true },
      _count: true,
    });
    const ratingMap = new Map(
      aggregates.map((a) => [
        a.foodItemId,
        { avg: a._avg.rating ?? 0, count: a._count },
      ]),
    );
    return items.map((item) => ({
      ...item,
      averageRating: ratingMap.get(item.id)?.avg ?? 0,
      totalReviews: ratingMap.get(item.id)?.count ?? 0,
    }));
  }

  async getFoodItems(categoryId?: string) {
    const where: any = { isEnabled: true };
    if (categoryId) where.categoryId = categoryId;

    const items = await this.prisma.foodItem.findMany({
      where,
      include: {
        category: true,
        productionStock: true,
      },
      orderBy: { name: 'asc' },
    });

    return this.enrichWithRating(items);
  }

  async getAllFoodItems() {
    const items = await this.prisma.foodItem.findMany({
      include: {
        category: true,
        productionStock: true,
      },
      orderBy: { name: 'asc' },
    });

    return this.enrichWithRating(items);
  }

  async getFoodItem(id: string) {
    const item = await this.prisma.foodItem.findUnique({
      where: { id },
      include: { category: true, productionStock: true },
    });
    if (!item) throw new NotFoundException(`Food item ${id} not found`);

    const [enriched] = await this.enrichWithRating([item]);
    return enriched;
  }

  async createFoodItem(dto: CreateFoodItemDto) {
    // Verify category exists
    await this.getCategory(dto.categoryId);

    const { stock, ...data } = dto;
    return this.prisma.foodItem.create({
      data: {
        ...data,
        productionStock: {
          create: { availableQty: stock ?? 0 }
        },
      },
      include: { category: true, productionStock: true },
    });
  }

  async updateFoodItem(id: string, dto: UpdateFoodItemDto) {
    await this.getFoodItem(id);

    const { stock, ...data } = dto;
    const updateData: any = { ...data };

    // Update stock if provided
    if (stock !== undefined) {
      const existingStock = await this.prisma.productionStock.findUnique({
        where: { foodItemId: id },
      });
      if (existingStock) {
        await this.prisma.productionStock.update({
          where: { foodItemId: id },
          data: { availableQty: stock },
        });
      } else {
        await this.prisma.productionStock.create({
          data: { foodItemId: id, availableQty: stock },
        });
      }
    }

    return this.prisma.foodItem.update({
      where: { id },
      data: updateData,
      include: { category: true, productionStock: true },
    });
  }

  async deleteFoodItem(id: string) {
    await this.getFoodItem(id);
    return this.prisma.foodItem.update({
      where: { id },
      data: { isEnabled: false },
    });
  }

  async getTodaysSpecials() {
    const items = await this.prisma.foodItem.findMany({
      where: { isTodaysSpecial: true, isEnabled: true },
      include: { category: true, productionStock: true },
    });

    return this.enrichWithRating(items);
  }

  // ─── Production Stock (Chief + Admin) ──────────────

  async listStock() {
    return this.prisma.foodItem.findMany({
      where: { isEnabled: true },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        category: { select: { id: true, name: true } },
        productionStock: { select: { availableQty: true, updatedAt: true } },
      },
      orderBy: [{ category: { displayOrder: 'asc' } }, { name: 'asc' }],
    });
  }

  async setStock(id: string, availableQty: number, updatedBy?: string) {
    if (!Number.isInteger(availableQty) || availableQty < 0) {
      throw new BadRequestException(
        'availableQty must be a non-negative integer',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Lock the FoodItem to serialize concurrent stock modifications (e.g. OrdersService)
      const foodItems = await tx.$queryRaw<any[]>`
        SELECT id FROM "FoodItem" WHERE id = ${id} FOR UPDATE
      `;

      if (foodItems.length === 0) {
        throw new NotFoundException(`Food item ${id} not found`);
      }

      const existingStock = await tx.productionStock.findUnique({
        where: { foodItemId: id },
      });

      if (existingStock) {
        return tx.productionStock.update({
          where: { foodItemId: id },
          data: { availableQty, updatedBy },
        });
      } else {
        return tx.productionStock.create({
          data: { foodItemId: id, availableQty, updatedBy },
        });
      }
    });
  }
}
