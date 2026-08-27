import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import {
  verifyWebhookSignature,
  getRazorpayConfig,
  RazorpayClient,
} from '@/infra/razorpay-client';

describe('UNIT — Razorpay Test Mode Client & Cryptographic Signature Verifier', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Credential Isolation & Environment Validation', () => {
    it('throws fail-closed error if RAZORPAY_KEY_SECRET is missing', () => {
      delete process.env.RAZORPAY_KEY_SECRET;
      process.env.RAZORPAY_KEY_ID = 'rzp_test_123';

      expect(() => getRazorpayConfig()).toThrowError(
        /Missing Razorpay credentials/i
      );
    });

    it('throws fail-closed error if RAZORPAY_KEY_ID is missing', () => {
      delete process.env.RAZORPAY_KEY_ID;
      delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      process.env.RAZORPAY_KEY_SECRET = 'secret_test_456';

      expect(() => getRazorpayConfig()).toThrowError(
        /Missing Razorpay credentials/i
      );
    });

    it('throws error if webhook secret is required but missing', () => {
      process.env.RAZORPAY_KEY_ID = 'rzp_test_123';
      process.env.RAZORPAY_KEY_SECRET = 'secret_test_456';
      delete process.env.RAZORPAY_WEBHOOK_SECRET;

      expect(() => getRazorpayConfig(true)).toThrowError(
        /Missing Razorpay webhook secret/i
      );
    });

    it('successfully extracts valid server credentials', () => {
      process.env.RAZORPAY_KEY_ID = 'rzp_test_123';
      process.env.RAZORPAY_KEY_SECRET = 'secret_test_456';
      process.env.RAZORPAY_WEBHOOK_SECRET = 'whsec_789';

      const config = getRazorpayConfig(true);
      expect(config.keyId).toBe('rzp_test_123');
      expect(config.keySecret).toBe('secret_test_456');
      expect(config.webhookSecret).toBe('whsec_789');
    });
  });

  describe('Raw-Body HMAC-SHA256 Signature Verification', () => {
    const testSecret = 'whsec_test_secret_123456';
    const samplePayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_9999',
            amount: 4200000,
            currency: 'INR',
            status: 'captured',
            order_id: 'order_test_8888',
          },
        },
      },
    });

    it('accepts exact matching signature generated with HMAC-SHA256', () => {
      const validSignature = crypto
        .createHmac('sha256', testSecret)
        .update(Buffer.from(samplePayload, 'utf-8'))
        .digest('hex');

      const isValid = verifyWebhookSignature(samplePayload, validSignature, testSecret);
      expect(isValid).toBe(true);
    });

    it('rejects tampered raw payload even if signature format is valid', () => {
      const validSignature = crypto
        .createHmac('sha256', testSecret)
        .update(Buffer.from(samplePayload, 'utf-8'))
        .digest('hex');

      const tamperedPayload = JSON.stringify({
        ...JSON.parse(samplePayload),
        extraField: 'tampered',
      });

      const isValid = verifyWebhookSignature(tamperedPayload, validSignature, testSecret);
      expect(isValid).toBe(false);
    });

    it('rejects signature generated with wrong secret', () => {
      const invalidSignature = crypto
        .createHmac('sha256', 'wrong_secret')
        .update(Buffer.from(samplePayload, 'utf-8'))
        .digest('hex');

      const isValid = verifyWebhookSignature(samplePayload, invalidSignature, testSecret);
      expect(isValid).toBe(false);
    });

    it('rejects null, undefined, or empty signatures', () => {
      expect(verifyWebhookSignature(samplePayload, null, testSecret)).toBe(false);
      expect(verifyWebhookSignature(samplePayload, undefined, testSecret)).toBe(false);
      expect(verifyWebhookSignature(samplePayload, '', testSecret)).toBe(false);
    });

    it('rejects if webhook secret is not configured', () => {
      const validSignature = crypto
        .createHmac('sha256', testSecret)
        .update(Buffer.from(samplePayload, 'utf-8'))
        .digest('hex');

      delete process.env.RAZORPAY_WEBHOOK_SECRET;
      expect(verifyWebhookSignature(samplePayload, validSignature)).toBe(false);
    });
  });

  describe('Order Creation & Parameter Serialization', () => {
    it('validates positive integer amounts in paise and sends HTTP Basic Auth', async () => {
      const client = new RazorpayClient({
        keyId: 'rzp_test_mock',
        keySecret: 'secret_mock',
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'order_rzp_mock_123',
          entity: 'order',
          amount: 4200000,
          amount_paid: 0,
          amount_due: 4200000,
          currency: 'INR',
          status: 'created',
          attempts: 0,
          notes: { case_id: 'case_123' },
          created_at: 1700000000,
        }),
      });
      global.fetch = mockFetch;

      const order = await client.createOrder({
        amountInPaise: 4200000,
        currency: 'INR',
        receipt: 'rcpt_123',
        notes: { case_id: 'case_123' },
      });

      expect(order.id).toBe('order_rzp_mock_123');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.razorpay.com/v1/orders');
      expect(options.method).toBe('POST');
      expect(options.headers.Authorization).toBe(
        `Basic ${Buffer.from('rzp_test_mock:secret_mock').toString('base64')}`
      );

      const sentBody = JSON.parse(options.body);
      expect(sentBody.amount).toBe(4200000);
      expect(sentBody.currency).toBe('INR');
      expect(sentBody.notes.case_id).toBe('case_123');
    });

    it('rejects invalid or non-positive order amounts', async () => {
      const client = new RazorpayClient({
        keyId: 'rzp_test_mock',
        keySecret: 'secret_mock',
      });

      await expect(client.createOrder({ amountInPaise: 0 })).rejects.toThrowError(
        /Invalid order amount/
      );
      await expect(client.createOrder({ amountInPaise: -500 })).rejects.toThrowError(
        /Invalid order amount/
      );
    });
  });
});
