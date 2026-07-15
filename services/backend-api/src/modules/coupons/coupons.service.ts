import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DiscountType } from '@prisma/client';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  /** Validate a coupon and return the discount amount + info */
  async validate(code: string, orderTotal: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException('Invalid coupon code');
    }

    const now = new Date();
    if (now < coupon.validFrom) {
      throw new BadRequestException('This coupon is not yet valid');
    }
    if (now > coupon.validTo) {
      throw new BadRequestException('This coupon has expired');
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestException('This coupon has reached its usage limit');
    }

    let discountAmount: number;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discountAmount =
        Math.round(orderTotal * (Number(coupon.value) / 100) * 100) / 100;
    } else {
      discountAmount = Math.min(Number(coupon.value), orderTotal);
    }

    return {
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.value),
      discountAmount,
      description:
        coupon.discountType === DiscountType.PERCENTAGE
          ? `${coupon.value}% off`
          : `₹${Number(coupon.value).toFixed(2)} off`,
    };
  }

  /** Increment usage count after successful order — atomic with limit check */
  async markUsed(code: string) {
    await this.prisma.$transaction(async (tx) => {
      const coupon = await tx.coupon.findUnique({
        where: { code: code.toUpperCase() },
      });
      if (!coupon) throw new NotFoundException('Coupon not found');
      if (
        coupon.usageLimit !== null &&
        coupon.usageCount >= coupon.usageLimit
      ) {
        throw new BadRequestException('Coupon usage limit reached');
      }
      await tx.coupon.update({
        where: { code: code.toUpperCase() },
        data: { usageCount: { increment: 1 } },
      });
    });
  }

  /** Create a new coupon (admin) */
  async create(data: {
    code: string;
    discountType: DiscountType;
    value: number;
    validFrom: string;
    validTo: string;
    usageLimit?: number;
  }) {
    return this.prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        value: data.value,
        validFrom: new Date(data.validFrom),
        validTo: new Date(data.validTo),
        usageLimit: data.usageLimit,
      },
    });
  }

  /** List all coupons (admin) */
  async findAll() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Delete a coupon (admin) */
  async remove(id: string) {
    return this.prisma.coupon.delete({ where: { id } });
  }
}
