import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('ReviewsService', () => {
  let service: ReviewsService;

  const mockPrisma = {
    foodItem: { findUnique: jest.fn() },
    review: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const customerId = 'user-1';
    const dto = { foodItemId: 'item-1', rating: 5, comment: 'Delicious!' };

    it('should throw if food item does not exist', async () => {
      mockPrisma.foodItem.findUnique.mockResolvedValue(null);

      await expect(service.create(customerId, dto)).rejects.toThrow(
        new BadRequestException('Food item not found'),
      );
      expect(mockPrisma.foodItem.findUnique).toHaveBeenCalledWith({
        where: { id: dto.foodItemId },
      });
    });

    it('should throw if customer already reviewed this item', async () => {
      mockPrisma.foodItem.findUnique.mockResolvedValue({ id: 'item-1' });
      mockPrisma.review.findFirst.mockResolvedValue({ id: 'existing-review' });

      await expect(service.create(customerId, dto)).rejects.toThrow(
        new BadRequestException('You have already reviewed this item'),
      );
      expect(mockPrisma.review.findFirst).toHaveBeenCalledWith({
        where: { customerId, foodItemId: dto.foodItemId },
      });
    });

    it('should create a review successfully', async () => {
      const createdReview = {
        id: 'review-1',
        customerId,
        foodItemId: dto.foodItemId,
        rating: 5,
        comment: 'Delicious!',
        customer: { id: customerId, name: 'Test User' },
      };

      mockPrisma.foodItem.findUnique.mockResolvedValue({ id: 'item-1' });
      mockPrisma.review.findFirst.mockResolvedValue(null);
      mockPrisma.review.create.mockResolvedValue(createdReview);

      const result = await service.create(customerId, dto);
      expect(result).toEqual(createdReview);
      expect(mockPrisma.review.create).toHaveBeenCalledWith({
        data: {
          customerId,
          foodItemId: dto.foodItemId,
          rating: 5,
          comment: 'Delicious!',
        },
        include: {
          customer: { select: { id: true, name: true } },
        },
      });
    });

    it('should create a review without optional comment', async () => {
      const dtoNoComment = { foodItemId: 'item-1', rating: 4 };
      const createdReview = {
        id: 'review-2',
        customerId,
        foodItemId: 'item-1',
        rating: 4,
        comment: null,
        customer: { id: customerId, name: 'Test User' },
      };

      mockPrisma.foodItem.findUnique.mockResolvedValue({ id: 'item-1' });
      mockPrisma.review.findFirst.mockResolvedValue(null);
      mockPrisma.review.create.mockResolvedValue(createdReview);

      const result = await service.create(customerId, dtoNoComment);
      expect(result).toEqual(createdReview);
    });
  });

  describe('findByItem', () => {
    const foodItemId = 'item-1';

    it('should return reviews with stats', async () => {
      const reviews = [
        {
          id: 'r1',
          rating: 5,
          comment: 'Great!',
          customer: { id: 'u1', name: 'Alice' },
          createdAt: new Date(),
        },
        {
          id: 'r2',
          rating: 4,
          comment: 'Good',
          customer: { id: 'u2', name: 'Bob' },
          createdAt: new Date(),
        },
      ];
      const aggregate = { _avg: { rating: 4.5 }, _count: 2 };

      mockPrisma.review.findMany.mockResolvedValue(reviews);
      mockPrisma.review.aggregate.mockResolvedValue(aggregate);

      const result = await service.findByItem(foodItemId);
      expect(result).toEqual({
        reviews,
        averageRating: 4.5,
        totalReviews: 2,
      });
      expect(mockPrisma.review.findMany).toHaveBeenCalledWith({
        where: { foodItemId },
        include: { customer: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('should return zero stats when no reviews', async () => {
      mockPrisma.review.findMany.mockResolvedValue([]);
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: 0,
      });

      const result = await service.findByItem(foodItemId);
      expect(result).toEqual({
        reviews: [],
        averageRating: 0,
        totalReviews: 0,
      });
    });
  });
});
