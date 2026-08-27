/**
 * Razorpay Test Mode Client & Verification Helper (Build-Order Step / Payment Integration)
 *
 * SECURE SERVER-SIDE ONLY MODULE.
 * NEVER import this module in client components or expose secrets to the browser.
 *
 * Capabilities:
 * - Server-side Order Creation via Razorpay REST API
 * - Server-side Payment Status Fetching for independent verification
 * - Raw-body HMAC-SHA256 Webhook Signature Verification with timingSafeEqual
 * - Fail-closed error handling for missing credentials
 */

import crypto from 'crypto';

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
}

export interface CreateOrderParams {
  amountInPaise: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt?: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface RazorpayPaymentResponse {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  method?: string;
  captured: boolean;
  email?: string;
  contact?: string;
  notes?: Record<string, string>;
  created_at: number;
}

/**
 * Retrieve server-side Razorpay credentials safely.
 * Throws explicit error if mandatory server credentials are missing.
 */
export function getRazorpayConfig(requireWebhookSecret = false): RazorpayConfig {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      'Missing Razorpay credentials. RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured in server environment.'
    );
  }

  if (requireWebhookSecret && !webhookSecret) {
    throw new Error(
      'Missing Razorpay webhook secret. RAZORPAY_WEBHOOK_SECRET must be configured in server environment.'
    );
  }

  return { keyId, keySecret, webhookSecret };
}

/**
 * Verify Razorpay Webhook Signature using the raw request body.
 *
 * CRITICAL SECURITY REQUIREMENTS:
 * - Operates strictly on the raw UTF-8 string or Buffer of the HTTP body
 * - Uses HMAC-SHA256 algorithm
 * - Uses crypto.timingSafeEqual to defend against side-channel timing attacks
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string | null | undefined,
  secret?: string
): boolean {
  if (!signature || !rawBody) {
    return false;
  }

  const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[RazorpayClient] Cannot verify signature: RAZORPAY_WEBHOOK_SECRET is not configured.');
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf-8') : rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
    const signatureBuffer = Buffer.from(signature.trim(), 'utf-8');

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch (err) {
    console.error('[RazorpayClient] Webhook signature verification error:', err);
    return false;
  }
}

export class RazorpayClient {
  private readonly config: RazorpayConfig;
  private readonly baseUrl = 'https://api.razorpay.com/v1';

  constructor(config?: RazorpayConfig) {
    this.config = config || getRazorpayConfig();
  }

  private get authHeader(): string {
    const authString = `${this.config.keyId}:${this.config.keySecret}`;
    return `Basic ${Buffer.from(authString).toString('base64')}`;
  }

  /**
   * Create a Razorpay Order server-side.
   */
  async createOrder(params: CreateOrderParams): Promise<RazorpayOrderResponse> {
    if (!params.amountInPaise || params.amountInPaise <= 0) {
      throw new Error(`Invalid order amount: ${params.amountInPaise}. Must be a positive integer in paise.`);
    }

    const payload = {
      amount: Math.round(params.amountInPaise),
      currency: params.currency || 'INR',
      receipt: params.receipt || `rcpt_${Date.now()}`,
      notes: params.notes || {},
    };

    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.authHeader,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Razorpay Order creation failed (${response.status}): ${errText}`);
    }

    return (await response.json()) as RazorpayOrderResponse;
  }

  /**
   * Fetch a payment status independently from Razorpay REST API.
   */
  async fetchPayment(paymentId: string): Promise<RazorpayPaymentResponse> {
    if (!paymentId) {
      throw new Error('Payment ID is required.');
    }

    const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        Authorization: this.authHeader,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to fetch Razorpay payment ${paymentId} (${response.status}): ${errText}`);
    }

    return (await response.json()) as RazorpayPaymentResponse;
  }
}
