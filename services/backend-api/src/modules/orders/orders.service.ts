import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { OrdersGateway } from './orders.gateway';
import { EmailService } from '../notifications/email.service';
import { SmsService } from '../notifications/sms.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CouponsService } from '../coupons/coupons.service';
import { paginate } from '../../common/pagination.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private ordersGateway: OrdersGateway,
    private emailService: EmailService,
    private smsService: SmsService,
    private notificationsService: NotificationsService,
    private couponsService: CouponsService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const { items, customerId, customerEmail, customerPhone, couponCode } =
      createOrderDto;

    if (!items || items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    return this.prisma.$transaction(async (tx) => {
      const foodItemIds = items.map((i) => i.foodItemId);

      // Use SELECT FOR UPDATE to lock stock rows and prevent race conditions
      const foodItemsDB = await tx.$queryRaw<
        Array<{
          id: string;
          name: string;
          price: Prisma.Decimal;
          isEnabled: boolean;
          productionStockId: string | null;
          productionStockAvailableQty: number | null;
        }>
      >`
        SELECT 
          fi.id,
          fi.name,
          fi.price,
          fi."isEnabled",
          ps.id as "productionStockId",
          ps."availableQty" as "productionStockAvailableQty"
        FROM "FoodItem" fi
        LEFT JOIN "ProductionStock" ps ON ps."foodItemId" = fi.id
        WHERE fi.id IN (${Prisma.join(foodItemIds)})
        FOR UPDATE
      `;

      if (foodItemsDB.length !== foodItemIds.length) {
        throw new BadRequestException('One or more food items are invalid');
      }

      let subtotal = 0;
      const orderItemsData: Array<{
        foodItemId: string;
        quantity: number;
        unitPrice: Prisma.Decimal;
        specialInstructions?: string;
      }> = [];
      const stockUpdates: Array<{ stockId: string; quantity: number }> = [];

      for (const item of items) {
        const dbItem = foodItemsDB.find((f) => f.id === item.foodItemId);
        if (!dbItem || !dbItem.isEnabled) {
          throw new BadRequestException(
            `Item ${dbItem?.name || item.foodItemId} is unavailable`,
          );
        }

        if (
          dbItem.productionStockId &&
          dbItem.productionStockAvailableQty !== null
        ) {
          if (dbItem.productionStockAvailableQty < item.quantity) {
            throw new BadRequestException(
              `Not enough stock for ${dbItem.name}. Only ${dbItem.productionStockAvailableQty} left.`,
            );
          }
          stockUpdates.push({
            stockId: dbItem.productionStockId,
            quantity: item.quantity,
          });
        }

        const itemTotal = Number(dbItem.price) * item.quantity;
        subtotal += itemTotal;

        orderItemsData.push({
          foodItemId: dbItem.id,
          quantity: item.quantity,
          unitPrice: dbItem.price,
          specialInstructions: item.specialInstructions,
        });
      }

      for (const update of stockUpdates) {
        await tx.productionStock.update({
          where: { id: update.stockId },
          data: { availableQty: { decrement: update.quantity } },
        });
      }

      const tax = subtotal * 0.1;

      let discount = 0;
      if (couponCode) {
        try {
          const couponResult = await this.couponsService.validate(
            couponCode,
            subtotal,
          );
          discount = couponResult.discountAmount;
        } catch {
          throw new BadRequestException('Invalid or expired coupon code');
        }
      }

      const total = Math.max(0, subtotal + tax - discount);

      const order = await tx.order.create({
        data: {
          customerId: customerId || null,
          status: OrderStatus.PLACED,
          paymentStatus: PaymentStatus.PENDING,
          subtotal,
          tax,
          discount,
          total,
          orderItems: { create: orderItemsData },
        },
        include: {
          orderItems: { include: { foodItem: true } },
          customer: {
            select: { id: true, email: true, name: true, phone: true },
          },
        },
      });

      if (couponCode) {
        void this.couponsService.markUsed(couponCode).catch(() => {});
      }

      this.ordersGateway.broadcastNewOrder(order);
      void this.sendOrderNotifications(
        order,
        OrderStatus.PLACED,
        customerEmail,
        customerPhone,
      );

      return order;
    });
  }

  async findAll(statusStr?: string, page: number = 1, limit: number = 20) {
    let where: Prisma.OrderWhereInput = {};
    if (statusStr) {
      const statuses = statusStr.split(',') as OrderStatus[];
      where = { status: { in: statuses } };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: {
          orderItems: { include: { foodItem: true } },
          customer: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findByCustomer(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: {
        orderItems: { include: { foodItem: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async trackOrder(orderId: string) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        subtotal: true,
        tax: true,
        discount: true,
        total: true,
        createdAt: true,
        updatedAt: true,
        orderItems: {
          select: {
            quantity: true,
            unitPrice: true,
            foodItem: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  /** Recent orders (for admin new-order polling) */
  async findRecent(since: string) {
    const sinceDate = new Date(since);
    return this.prisma.order.findMany({
      where: { createdAt: { gte: sinceDate } },
      include: {
        orderItems: { include: { foodItem: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getOverviewStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysOrders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: today },
        status: { not: OrderStatus.CANCELLED },
      },
    });

    const revenue = todaysOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0,
    );
    const totalOrders = todaysOrders.length;

    const activeOrders = await this.prisma.order.count({
      where: {
        status: {
          in: [OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PREPARING],
        },
      },
    });

    return { revenue, totalOrders, activeOrders };
  }

  findOne(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: { include: { foodItem: true } },
        customer: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async updateStatus(id: string, status: OrderStatus, reason?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: { include: { foodItem: true } },
        customer: { select: { id: true, email: true, phone: true, name: true } },
      },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PLACED: ['ACCEPTED', 'PREPARING', 'CANCELLED'],
      ACCEPTED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY', 'CANCELLED'],
      READY: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    const allowed = validTransitions[order.status];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${status}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    const statusesRequiringRestore: OrderStatus[] = [
      OrderStatus.PLACED,
      OrderStatus.ACCEPTED,
      OrderStatus.PREPARING,
    ];
    const shouldRestoreStock =
      status === OrderStatus.CANCELLED &&
      statusesRequiringRestore.includes(order.status as OrderStatus);

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          status,
          ...(status === OrderStatus.CANCELLED
            ? { cancelReason: reason || 'Cancelled' }
            : {}),
        },
        include: { orderItems: { include: { foodItem: true } } },
      });

      if (shouldRestoreStock) {
        for (const item of order.orderItems) {
          const stock = await tx.productionStock.findUnique({
            where: { foodItemId: item.foodItemId },
          });
          if (stock) {
            await tx.productionStock.update({
              where: { id: stock.id },
              data: { availableQty: { increment: item.quantity } },
            });
          }
        }
      }

      return updated;
    });

    this.ordersGateway.broadcastOrderStatusUpdate(updatedOrder);

    // Persist in-app notification for the customer (so they see it on next
    // login / poll). This is what drives "order completed" alerts in the
    // customer app now that dine-in/table flow is gone.
    if (order.customerId) {
      void this.notificationsService
        .create({
          userId: order.customerId,
          title: this.notificationTitle(status),
          message: this.notificationBody(order.id, status),
        })
        .catch(() => {});
    }

    // Fire-and-forget email / SMS
    void this.sendOrderNotifications(
      { ...updatedOrder, customer: order.customer },
      status,
      order.customer?.email ?? undefined,
      order.customer?.phone ?? undefined,
    );

    return updatedOrder;
  }

  /**
   * Recall an order back into the kitchen. Used when a READY or COMPLETED
   * order needs to be remade (customer complaint, wrong item, cold food, …).
   * Bypasses the normal forward-only state machine and moves the order back
   * to PREPARING so it re-appears on the Chief KDS. The reason is stamped
   * onto `cancelReason` with a `RECALL:` prefix so the field doubles as a
   * lightweight note without a schema change.
   */
  async recall(id: string, reason?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: { include: { foodItem: true } },
        customer: {
          select: { id: true, email: true, phone: true, name: true },
        },
      },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);

    const recallable: OrderStatus[] = [
      OrderStatus.READY,
      OrderStatus.COMPLETED,
    ];
    if (!recallable.includes(order.status as OrderStatus)) {
      throw new BadRequestException(
        `Only READY or COMPLETED orders can be recalled (current: ${order.status}).`,
      );
    }

    const note = `RECALL: ${(reason || 'Sent back to kitchen').trim()}`;

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.PREPARING,
        cancelReason: note,
      },
      include: { orderItems: { include: { foodItem: true } } },
    });

    this.ordersGateway.broadcastOrderStatusUpdate(updatedOrder);

    if (order.customerId) {
      void this.notificationsService
        .create({
          userId: order.customerId,
          title: 'Order being remade',
          message: `Your order #${order.id.slice(0, 6)} is being remade by the kitchen.`,
        })
        .catch(() => {});
    }

    return updatedOrder;


  /**
   * Customer-initiated cancel. Only the order's own customer may call this,
   * and only while the order is still in PLACED status.
   */
  async cancelByCustomer(id: string, userId: string, reason?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    if (order.customerId !== userId) {
      throw new ForbiddenException('You can only cancel your own orders');
    }
    if (order.status !== OrderStatus.PLACED) {
      throw new BadRequestException(
        'Order can no longer be cancelled — the kitchen has already picked it up.',
      );
    }
    return this.updateStatus(
      id,
      OrderStatus.CANCELLED,
      reason || 'Cancelled by customer',
    );
  }

  async getAnalytics(days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: since },
        status: { not: OrderStatus.CANCELLED },
      },
      include: { orderItems: { include: { foodItem: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const revenueByDay: Record<string, number> = {};
    for (const order of orders) {
      const day = order.createdAt.toISOString().split('T')[0];
      revenueByDay[day] = (revenueByDay[day] || 0) + Number(order.total);
    }
    const revenueTrend = Object.entries(revenueByDay)
      .map(([date, revenue]) => ({
        date,
        revenue: Math.round(revenue * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const itemCounts: Record<
      string,
      { name: string; count: number; revenue: number }
    > = {};
    for (const order of orders) {
      for (const oi of order.orderItems) {
        const itemName = oi.foodItem?.name || 'Unknown';
        if (!itemCounts[itemName])
          itemCounts[itemName] = { name: itemName, count: 0, revenue: 0 };
        itemCounts[itemName].count += oi.quantity;
        itemCounts[itemName].revenue += Number(oi.unitPrice) * oi.quantity;
      }
    }
    const popularItems = Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const hourCounts: Record<number, number> = {};
    for (const order of orders) {
      const hour = order.createdAt.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
    const peakHours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i.toString().padStart(2, '0')}:00`,
      orders: hourCounts[i] || 0,
    }));

    const paymentStatusCounts: Record<string, number> = {};
    for (const order of orders) {
      const status = order.paymentStatus || 'PENDING';
      paymentStatusCounts[status] = (paymentStatusCounts[status] || 0) + 1;
    }
    const paymentBreakdown = Object.entries(paymentStatusCounts).map(
      ([status, count]) => ({ status, count }),
    );

    const ordersWithDiscount = orders.filter((o) => Number(o.discount) > 0);
    const totalDiscountGiven = ordersWithDiscount.reduce(
      (s, o) => s + Number(o.discount),
      0,
    );
    const discountOrderCount = ordersWithDiscount.length;

    const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      period: { days, since: since.toISOString() },
      revenueTrend,
      popularItems,
      peakHours,
      paymentBreakdown,
      discountStats: {
        totalDiscountGiven: Math.round(totalDiscountGiven * 100) / 100,
        discountOrderCount,
        discountPercentage:
          totalOrders > 0
            ? Math.round((discountOrderCount / totalOrders) * 100)
            : 0,
        averageDiscountPerOrder:
          discountOrderCount > 0
            ? Math.round((totalDiscountGiven / discountOrderCount) * 100) / 100
            : 0,
      },
    };
  }

  // ─── Helpers ─────────────────────────────────────────

  private notificationTitle(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.ACCEPTED:
        return 'Order accepted';
      case OrderStatus.PREPARING:
        return 'The kitchen is on it';
      case OrderStatus.READY:
        return 'Your order is ready!';
      case OrderStatus.COMPLETED:
        return 'Enjoy your meal 🍽️';
      case OrderStatus.CANCELLED:
        return 'Order cancelled';
      default:
        return 'Order update';
    }
  }

  private notificationBody(orderId: string, status: OrderStatus): string {
    const short = orderId.slice(0, 8);
    switch (status) {
      case OrderStatus.READY:
        return `Order #${short} is ready for pickup.`;
      case OrderStatus.COMPLETED:
        return `Order #${short} is complete. Thanks for ordering!`;
      case OrderStatus.CANCELLED:
        return `Order #${short} has been cancelled.`;
      default:
        return `Order #${short} status: ${status}.`;
    }
  }

  private sendOrderNotifications(
    order: any,
    status: OrderStatus,
    customerEmail?: string,
    customerPhone?: string,
  ) {
    try {
      const itemsSummary =
        order.orderItems
          ?.slice(0, 3)
          .map((oi: any) => `${oi.quantity}x ${oi.foodItem?.name || 'Item'}`)
          .join(', ') + (order.orderItems?.length > 3 ? ' + more' : '');

      const details = {
        items: itemsSummary,
        total: `₹${Number(order.total).toFixed(2)}`,
      };

      if (customerEmail) {
        void this.emailService.sendOrderStatus(
          customerEmail,
          order.id,
          status,
          details,
        );
      }
      if (customerPhone) {
        void this.smsService.sendOrderStatus(customerPhone, order.id, status);
      }
    } catch {
      // Non-critical
    }
  }
}
