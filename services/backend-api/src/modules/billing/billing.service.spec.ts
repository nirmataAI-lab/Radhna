import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('BillingService', () => {
  let service: BillingService;

  const mockPrisma = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((cb: any) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Set Razorpay env vars so constructor doesn't warn
    process.env.RAZORPAY_KEY_ID = 'test_key';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  afterAll(() => {
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject createPaymentOrder for non-existent order', async () => {
    mockPrisma.order.findUnique.mockResolvedValue(null);
    await expect(service.createPaymentOrder('fake-id')).rejects.toThrow(
      'Order fake-id not found',
    );
  });

  it('should reject verifyPayment with invalid signature', async () => {
    const dto = {
      razorpayOrderId: 'order_1',
      razorpayPaymentId: 'pay_1',
      razorpaySignature: 'invalid-sig',
      orderId: 'order-1',
    };

    process.env.RAZORPAY_KEY_SECRET = 'test_secret';
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'order-1' });

    await expect(service.verifyPayment(dto)).rejects.toThrow(
      'Invalid payment signature',
    );
  });

  it('should reject handleWebhook with invalid signature', async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = 'webhook_secret';
    const body = JSON.stringify({ event: 'payment.captured' });

    // Wrong signature
    await expect(
      service.handleWebhook(body, 'wrong-signature'),
    ).rejects.toThrow('Invalid webhook signature');
  });

  it('should get payments by order', async () => {
    const payments = [{ id: 'pay-1', amount: 100 }];
    mockPrisma.payment.findMany.mockResolvedValue(payments);

    const result = await service.getPaymentsByOrder('order-1');
    expect(result).toEqual(payments);
    expect(mockPrisma.payment.findMany).toHaveBeenCalledWith({
      where: { orderId: 'order-1' },
      orderBy: { createdAt: 'desc' },
    });
  });
});
