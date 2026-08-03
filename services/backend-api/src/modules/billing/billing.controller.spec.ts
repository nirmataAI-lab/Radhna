import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

describe('BillingController', () => {
  let controller: BillingController;

  const mockBillingService = {
    createPaymentOrder: jest.fn(),
    verifyPayment: jest.fn(),
    handleWebhook: jest.fn(),
    getPaymentsByOrder: jest.fn(),
  };
  const mockWebhookQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        { provide: BillingService, useValue: mockBillingService },
        { provide: getQueueToken('webhooks'), useValue: mockWebhookQueue },
      ],
    }).compile();

    controller = module.get<BillingController>(BillingController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPaymentOrder', () => {
    it('should call billingService.createPaymentOrder', async () => {
      const orderId = 'test-order-id';
      const expectedResult = { razorpayOrderId: 'rzp_test', amount: 1000 };
      mockBillingService.createPaymentOrder.mockResolvedValue(expectedResult);

      const result = await controller.createPaymentOrder(orderId);

      expect(mockBillingService.createPaymentOrder).toHaveBeenCalledWith(
        orderId,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('verifyPayment', () => {
    it('should call billingService.verifyPayment with the DTO', async () => {
      const dto = {
        razorpayOrderId: 'rzp_order',
        razorpayPaymentId: 'rzp_pay',
        razorpaySignature: 'sig',
        orderId: 'order-1',
      };
      const expectedResult = { success: true, order: { id: 'order-1' } };
      mockBillingService.verifyPayment.mockResolvedValue(expectedResult);

      const result = await controller.verifyPayment(dto);

      expect(mockBillingService.verifyPayment).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('handleWebhook', () => {
    it('should throw if signature header is missing', async () => {
      await expect(controller.handleWebhook({} as any, '')).rejects.toThrow(
        'Missing webhook signature',
      );
    });

    it('should call billingService.handleWebhook with signature', async () => {
      const mockReq = { rawBody: '{"event":"payment.captured"}' };
      mockWebhookQueue.add.mockResolvedValue({ id: 'job-1' });

      const result = await controller.handleWebhook(
        mockReq as any,
        'valid-sig',
      );

      expect(mockWebhookQueue.add).toHaveBeenCalledWith(
        'razorpay.event',
        { rawBody: '{"event":"payment.captured"}', signature: 'valid-sig' },
        { attempts: 5, backoff: { type: 'exponential', delay: 2000 } },
      );
      expect(result).toEqual({ status: 'ok' });
    });
  });

  describe('getPayments', () => {
    it('should call billingService.getPaymentsByOrder', async () => {
      const orderId = 'order-1';
      const expectedPayments = [{ id: 'pay-1', amount: 100 }];
      mockBillingService.getPaymentsByOrder.mockResolvedValue(expectedPayments);

      const result = await controller.getPayments(orderId);

      expect(mockBillingService.getPaymentsByOrder).toHaveBeenCalledWith(
        orderId,
      );
      expect(result).toEqual(expectedPayments);
    });
  });
});
