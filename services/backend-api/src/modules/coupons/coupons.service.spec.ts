import { Test, TestingModule } from '@nestjs/testing';
import { CouponsService } from './coupons.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DiscountType } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CouponsService', () => {
  let service: CouponsService;

  const mockPrisma = {
    $transaction: jest.fn(),
    coupon: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    const baseCoupon = {
      id: 'c1',
      code: 'SAVE10',
      discountType: DiscountType.PERCENTAGE,
      value: 10,
      validFrom: new Date('2024-01-01'),
      validTo: new Date('2030-12-31'),
      usageLimit: 100,
      usageCount: 5,
      createdAt: new Date(),
    };

    it('should throw NotFoundException for non-existent coupon', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);

      await expect(service.validate('INVALID', 100)).rejects.toThrow(
        new NotFoundException('Invalid coupon code'),
      );
      expect(mockPrisma.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'INVALID' },
      });
    });

    it('should throw if coupon is not yet valid', async () => {
      const futureCoupon = {
        ...baseCoupon,
        validFrom: new Date('2099-01-01'),
      };
      mockPrisma.coupon.findUnique.mockResolvedValue(futureCoupon);

      await expect(service.validate('FUTURE', 100)).rejects.toThrow(
        new BadRequestException('This coupon is not yet valid'),
      );
    });

    it('should throw if coupon has expired', async () => {
      const expiredCoupon = {
        ...baseCoupon,
        validTo: new Date('2020-01-01'),
      };
      mockPrisma.coupon.findUnique.mockResolvedValue(expiredCoupon);

      await expect(service.validate('EXPIRED', 100)).rejects.toThrow(
        new BadRequestException('This coupon has expired'),
      );
    });

    it('should throw if coupon usage limit reached', async () => {
      const usedUpCoupon = {
        ...baseCoupon,
        usageLimit: 10,
        usageCount: 10,
      };
      mockPrisma.coupon.findUnique.mockResolvedValue(usedUpCoupon);

      await expect(service.validate('USEDUP', 100)).rejects.toThrow(
        new BadRequestException('This coupon has reached its usage limit'),
      );
    });

    it('should validate a percentage coupon', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(baseCoupon);

      const result = await service.validate('SAVE10', 200);
      expect(result).toEqual({
        valid: true,
        code: 'SAVE10',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        discountAmount: 20,
        description: '10% off',
      });
    });

    it('should validate a flat discount coupon', async () => {
      const flatCoupon = {
        ...baseCoupon,
        code: 'FLAT50',
        discountType: DiscountType.FLAT,
        value: 50,
      };
      mockPrisma.coupon.findUnique.mockResolvedValue(flatCoupon);

      const result = await service.validate('FLAT50', 200);
      expect(result).toEqual({
        valid: true,
        code: 'FLAT50',
        discountType: DiscountType.FLAT,
        discountValue: 50,
        discountAmount: 50,
        description: '₹50.00 off',
      });
    });

    it('should not discount more than the order total for flat coupons', async () => {
      const bigFlatCoupon = {
        ...baseCoupon,
        code: 'BIG50',
        discountType: DiscountType.FLAT,
        value: 200,
      };
      mockPrisma.coupon.findUnique.mockResolvedValue(bigFlatCoupon);

      const result = await service.validate('BIG50', 30);
      expect(result.discountAmount).toBe(30); // Math.min(200, 30)
    });

    it('should handle coupon without usageLimit (unlimited)', async () => {
      const unlimitedCoupon = {
        ...baseCoupon,
        code: 'UNLIMITED',
        usageLimit: null,
        usageCount: 999,
      };
      mockPrisma.coupon.findUnique.mockResolvedValue(unlimitedCoupon);

      const result = await service.validate('UNLIMITED', 100);
      expect(result.valid).toBe(true);
    });
  });

  describe('markUsed', () => {
    it('should increment usage count', async () => {
      const coupon = { code: 'SAVE10', usageCount: 0, usageLimit: 10 };
      mockPrisma.$transaction.mockImplementation(
        async (cb: (tx: any) => Promise<any>) => {
          const tx = {
            coupon: {
              findUnique: jest.fn().mockResolvedValue(coupon),
              update: jest.fn().mockResolvedValue({}),
            },
          };
          return cb(tx);
        },
      );

      await service.markUsed('SAVE10');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new coupon with uppercase code', async () => {
      const dto = {
        code: 'newcode',
        discountType: DiscountType.PERCENTAGE,
        value: 15,
        validFrom: '2025-01-01T00:00:00.000Z',
        validTo: '2025-12-31T00:00:00.000Z',
        usageLimit: 50,
      };

      const created = {
        id: 'new-id',
        ...dto,
        code: 'NEWCODE',
        usageCount: 0,
        createdAt: new Date(),
      };
      mockPrisma.coupon.create.mockResolvedValue(created);

      const result = await service.create(dto);
      expect(result).toEqual(created);
      expect(mockPrisma.coupon.create).toHaveBeenCalledWith({
        data: {
          code: 'NEWCODE',
          discountType: DiscountType.PERCENTAGE,
          value: 15,
          validFrom: expect.any(Date),
          validTo: expect.any(Date),
          usageLimit: 50,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all coupons ordered by creation date', async () => {
      const coupons = [{ id: 'c1' }, { id: 'c2' }];
      mockPrisma.coupon.findMany.mockResolvedValue(coupons);

      const result = await service.findAll();
      expect(result).toEqual(coupons);
      expect(mockPrisma.coupon.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('remove', () => {
    it('should delete a coupon by id', async () => {
      mockPrisma.coupon.delete.mockResolvedValue({ id: 'c1' });

      const result = await service.remove('c1');
      expect(mockPrisma.coupon.delete).toHaveBeenCalledWith({
        where: { id: 'c1' },
      });
    });
  });
});
