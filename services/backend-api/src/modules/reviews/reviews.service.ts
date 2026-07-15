import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(customerId: string, dto: CreateReviewDto) {
    // Verify food item exists
    const foodItem = await this.prisma.foodItem.findUnique({
      where: { id: dto.foodItemId },
    });
    if (!foodItem) {
      throw new BadRequestException('Food item not found');
    }

    // Check if customer already reviewed this item
    const existing = await this.prisma.review.findFirst({
      where: { customerId, foodItemId: dto.foodItemId },
    });
    if (existing) {
      throw new BadRequestException('You have already reviewed this item');
    }

    return this.prisma.review.create({
      data: {
        customerId,
        foodItemId: dto.foodItemId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        customer: { select: { id: true, name: true } },
      },
    });
  }

  async findByItem(foodItemId: string) {
    const [reviews, aggregate] = await Promise.all([
      this.prisma.review.findMany({
        where: { foodItemId },
        include: {
          customer: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.review.aggregate({
        where: { foodItemId },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    return {
      reviews,
      averageRating: aggregate._avg.rating
        ? Math.round(aggregate._avg.rating * 10) / 10
        : 0,
      totalReviews: aggregate._count,
    };
  }
}
