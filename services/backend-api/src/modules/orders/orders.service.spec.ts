import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersGateway } from './orders.gateway';
import { EmailService } from '../notifications/email.service';
import { SmsService } from '../notifications/sms.service';
import { CouponsService } from '../coupons/coupons.service';

describe('OrdersService', () => {
  let service: OrdersService;

  const mockPrisma = {
    $transaction: jest.fn(),
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    table: { findUnique: jest.fn() },
    foodItem: { findMany: jest.fn() },
    productionStock: { update: jest.fn(), deleteMany: jest.fn() },
  };

  const mockGateway = {
    broadcastNewOrder: jest.fn(),
    broadcastOrderStatusUpdate: jest.fn(),
  };

  const mockEmail = {
    sendOrderStatus: jest.fn().mockResolvedValue({ preview: true }),
  };

  const mockSms = {
    sendOrderStatus: jest.fn().mockResolvedValue({ success: true }),
  };

  const mockCoupons = {
    validate: jest.fn(),
    markUsed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OrdersGateway, useValue: mockGateway },
        { provide: EmailService, useValue: mockEmail },
        { provide: SmsService, useValue: mockSms },
        { provide: CouponsService, useValue: mockCoupons },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated orders when no status filter', async () => {
      const orders = [{ id: '1' }];
      mockPrisma.$transaction.mockResolvedValue([orders, 1]);
      mockPrisma.order.count.mockResolvedValue(1);

      const result = await service.findAll();
      expect(result.data).toEqual(orders);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should filter by status when provided', async () => {
      mockPrisma.order.findMany.mockReturnValue(Promise.resolve([]));
      mockPrisma.order.count.mockReturnValue(Promise.resolve(0));
      mockPrisma.$transaction.mockImplementation((args) =>
        Promise.resolve(args),
      );
      await service.findAll('PLACED');
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: { in: ['PLACED'] } },
        }),
      );
    });
  });

  describe('findByCustomer', () => {
    it('should return orders for a specific customer', async () => {
      const orders = [{ id: '1', customerId: 'user-1' }];
      mockPrisma.order.findMany.mockResolvedValue(orders);

      const result = await service.findByCustomer('user-1');
      expect(result).toEqual(orders);
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customerId: 'user-1' },
          take: 50,
        }),
      );
    });
  });

  describe('getOverviewStats', () => {
    it('should return calculated stats', async () => {
      mockPrisma.order.findMany
        .mockResolvedValueOnce([{ total: '100' }, { total: '200' }])
        .mockResolvedValueOnce([{ tableId: 't1' }, { tableId: 't2' }]);

      const result = await service.getOverviewStats();
      expect(result).toEqual({ revenue: 300, totalOrders: 2, activeTables: 2 });
    });
  });

  describe('getAnalytics — discountStats', () => {
    const baseOrders = [
      {
        id: 'o1',
        total: '100',
        subtotal: '110',
        discount: '0',
        paymentStatus: 'PAID',
        createdAt: new Date('2025-01-01T12:00:00Z'),
        orderItems: [
          { quantity: 2, unitPrice: '50', foodItem: { name: 'Pizza' } },
        ],
      },
      {
        id: 'o2',
        total: '80',
        subtotal: '90',
        discount: '10',
        paymentStatus: 'PAID',
        createdAt: new Date('2025-01-02T13:00:00Z'),
        orderItems: [
          { quantity: 1, unitPrice: '80', foodItem: { name: 'Burger' } },
        ],
      },
      {
        id: 'o3',
        total: '150',
        subtotal: '170',
        discount: '20',
        paymentStatus: 'PENDING',
        createdAt: new Date('2025-01-03T14:00:00Z'),
        orderItems: [
          { quantity: 3, unitPrice: '50', foodItem: { name: 'Pasta' } },
        ],
      },
      {
        id: 'o4',
        total: '50',
        subtotal: '55',
        discount: '5',
        paymentStatus: 'PAID',
        createdAt: new Date('2025-01-04T10:00:00Z'),
        orderItems: [
          { quantity: 1, unitPrice: '50', foodItem: { name: 'Salad' } },
        ],
      },
      {
        id: 'o5',
        total: '200',
        subtotal: '220',
        discount: '0',
        paymentStatus: 'PAID',
        createdAt: new Date('2025-01-05T18:00:00Z'),
        orderItems: [
          { quantity: 4, unitPrice: '50', foodItem: { name: 'Sushi' } },
        ],
      },
    ];

    it('should return correct discount stats with mixed orders', async () => {
      mockPrisma.order.findMany.mockResolvedValue(baseOrders);

      const result = await service.getAnalytics(90);

      // Total discount from orders 2,3,4: 10 + 20 + 5 = 35
      expect(result.discountStats.totalDiscountGiven).toBe(35);
      // 3 orders have discount > 0
      expect(result.discountStats.discountOrderCount).toBe(3);
      // 3/5 = 60%
      expect(result.discountStats.discountPercentage).toBe(60);
      // 35/3 = 11.67
      expect(result.discountStats.averageDiscountPerOrder).toBeCloseTo(
        11.67,
        1,
      );
    });

    it('should return zero discount stats when no discounts applied', async () => {
      const noDiscountOrders = baseOrders.map((o) => ({ ...o, discount: '0' }));
      mockPrisma.order.findMany.mockResolvedValue(noDiscountOrders);

      const result = await service.getAnalytics(90);

      expect(result.discountStats.totalDiscountGiven).toBe(0);
      expect(result.discountStats.discountOrderCount).toBe(0);
      expect(result.discountStats.discountPercentage).toBe(0);
      expect(result.discountStats.averageDiscountPerOrder).toBe(0);
    });

    it('should return zero discount stats when no orders exist', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);

      const result = await service.getAnalytics(90);

      expect(result.totalRevenue).toBe(0);
      expect(result.totalOrders).toBe(0);
      expect(result.averageOrderValue).toBe(0);
      expect(result.discountStats.totalDiscountGiven).toBe(0);
      expect(result.discountStats.discountOrderCount).toBe(0);
      expect(result.discountStats.discountPercentage).toBe(0);
      expect(result.discountStats.averageDiscountPerOrder).toBe(0);
    });

    it('should calculate revenue trend correctly', async () => {
      mockPrisma.order.findMany.mockResolvedValue(baseOrders);

      const result = await service.getAnalytics(90);

      expect(result.revenueTrend.length).toBeGreaterThanOrEqual(5);
      expect(result.totalRevenue).toBe(580); // 100 + 80 + 150 + 50 + 200
      expect(result.totalOrders).toBe(5);
    });
  });
});
