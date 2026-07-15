import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersGateway } from './orders.gateway';
import { EmailService } from '../notifications/email.service';
import { SmsService } from '../notifications/sms.service';
import { NotificationsService } from '../notifications/notifications.service';
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
    foodItem: { findMany: jest.fn() },
    productionStock: { update: jest.fn(), deleteMany: jest.fn() },
  };

  const mockGateway = {
    broadcastNewOrder: jest.fn(),
    broadcastOrderStatusUpdate: jest.fn(),
  };
  const mockEmail = { sendOrderStatus: jest.fn().mockResolvedValue({ preview: true }) };
  const mockSms = { sendOrderStatus: jest.fn().mockResolvedValue({ success: true }) };
  const mockNotifications = { create: jest.fn().mockResolvedValue({ id: 'n1' }) };
  const mockCoupons = { validate: jest.fn(), markUsed: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OrdersGateway, useValue: mockGateway },
        { provide: EmailService, useValue: mockEmail },
        { provide: SmsService, useValue: mockSms },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: CouponsService, useValue: mockCoupons },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns paginated orders when no status filter', async () => {
      const orders = [{ id: '1' }];
      mockPrisma.$transaction.mockResolvedValue([orders, 1]);
      const result = await service.findAll();
      expect(result.data).toEqual(orders);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });
  });

  describe('findByCustomer', () => {
    it('returns orders for a customer', async () => {
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
    it('returns calculated stats (revenue, totalOrders, activeOrders)', async () => {
      mockPrisma.order.findMany.mockResolvedValueOnce([
        { total: '100' },
        { total: '200' },
      ]);
      mockPrisma.order.count.mockResolvedValueOnce(3);
      const result = await service.getOverviewStats();
      expect(result).toEqual({ revenue: 300, totalOrders: 2, activeOrders: 3 });
    });
  });

  describe('getAnalytics — discountStats', () => {
    const baseOrders = [
      { id: 'o1', total: '100', subtotal: '110', discount: '0', paymentStatus: 'PAID', createdAt: new Date('2025-01-01T12:00:00Z'), orderItems: [{ quantity: 2, unitPrice: '50', foodItem: { name: 'Pizza' } }] },
      { id: 'o2', total: '80', subtotal: '90', discount: '10', paymentStatus: 'PAID', createdAt: new Date('2025-01-02T13:00:00Z'), orderItems: [{ quantity: 1, unitPrice: '80', foodItem: { name: 'Burger' } }] },
      { id: 'o3', total: '150', subtotal: '170', discount: '20', paymentStatus: 'PENDING', createdAt: new Date('2025-01-03T14:00:00Z'), orderItems: [{ quantity: 3, unitPrice: '50', foodItem: { name: 'Pasta' } }] },
      { id: 'o4', total: '50', subtotal: '55', discount: '5', paymentStatus: 'PAID', createdAt: new Date('2025-01-04T10:00:00Z'), orderItems: [{ quantity: 1, unitPrice: '50', foodItem: { name: 'Salad' } }] },
      { id: 'o5', total: '200', subtotal: '220', discount: '0', paymentStatus: 'PAID', createdAt: new Date('2025-01-05T18:00:00Z'), orderItems: [{ quantity: 4, unitPrice: '50', foodItem: { name: 'Sushi' } }] },
    ];

    it('correct discount stats with mixed orders', async () => {
      mockPrisma.order.findMany.mockResolvedValue(baseOrders);
      const result = await service.getAnalytics(90);
      expect(result.discountStats.totalDiscountGiven).toBe(35);
      expect(result.discountStats.discountOrderCount).toBe(3);
      expect(result.discountStats.discountPercentage).toBe(60);
      expect(result.discountStats.averageDiscountPerOrder).toBeCloseTo(11.67, 1);
    });

    it('zero discount stats when none applied', async () => {
      mockPrisma.order.findMany.mockResolvedValue(
        baseOrders.map((o) => ({ ...o, discount: '0' })),
      );
      const result = await service.getAnalytics(90);
      expect(result.discountStats.totalDiscountGiven).toBe(0);
      expect(result.discountStats.discountOrderCount).toBe(0);
    });

    it('zero everything when no orders', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      const result = await service.getAnalytics(90);
      expect(result.totalRevenue).toBe(0);
      expect(result.totalOrders).toBe(0);
    });

    it('revenue trend and totals', async () => {
      mockPrisma.order.findMany.mockResolvedValue(baseOrders);
      const result = await service.getAnalytics(90);
      expect(result.revenueTrend.length).toBeGreaterThanOrEqual(5);
      expect(result.totalRevenue).toBe(580);
      expect(result.totalOrders).toBe(5);
    });
  });
});
