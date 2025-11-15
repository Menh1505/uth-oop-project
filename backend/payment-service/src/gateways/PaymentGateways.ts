import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { 
  PaymentGateway, 
  PaymentStatus, 
  ApplePayToken,
  PayOSPaymentRequest, 
  PayOSPaymentResponse,
  WebhookData 
} from '../models/Payment';
import { PAYMENT_CONFIG } from '../config/payment';

// Base Gateway Interface
export interface PaymentGatewayInterface {
  createPayment(paymentData: any): Promise<any>;
  getPaymentStatus(transactionId: string): Promise<PaymentStatus>;
  cancelPayment(transactionId: string): Promise<boolean>;
  createRefund(transactionId: string, amount: number, reason: string): Promise<any>;
}

// Apple Pay Gateway (Mock Implementation)
export class ApplePayGateway implements PaymentGatewayInterface {
  private config = PAYMENT_CONFIG.APPLE_PAY;
  
  async createPayment(paymentData: {
    amount: number;
    currency: string;
    applePayToken: ApplePayToken;
    merchantId: string;
    description: string;
  }): Promise<{
    success: boolean;
    transactionId?: string;
    status: PaymentStatus;
    message: string;
  }> {
    try {
      // Simulate API call to Apple Pay
      console.log('🍎 Processing Apple Pay payment:', {
        amount: paymentData.amount,
        currency: paymentData.currency,
        merchantId: paymentData.merchantId
      });
      
      // Mock validation
      if (!paymentData.applePayToken || !paymentData.merchantId) {
        return {
          success: false,
          status: PaymentStatus.FAILED,
          message: 'Invalid Apple Pay token or merchant ID'
        };
      }
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock success/failure (90% success rate)
      const isSuccess = Math.random() > 0.1;
      
      if (isSuccess) {
        const transactionId = `applepay_${uuidv4()}`;
        return {
          success: true,
          transactionId,
          status: PaymentStatus.COMPLETED,
          message: 'Apple Pay payment processed successfully'
        };
      } else {
        return {
          success: false,
          status: PaymentStatus.FAILED,
          message: 'Apple Pay payment failed - card declined'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        message: `Apple Pay error: ${error.message}`
      };
    }
  }
  
  async getPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    // Mock status check
    console.log('🍎 Checking Apple Pay status for:', transactionId);
    return PaymentStatus.COMPLETED;
  }
  
  async cancelPayment(transactionId: string): Promise<boolean> {
    console.log('🍎 Cancelling Apple Pay payment:', transactionId);
    return true;
  }
  
  async createRefund(transactionId: string, amount: number, reason: string): Promise<{
    success: boolean;
    refundId?: string;
    message: string;
  }> {
    console.log('🍎 Creating Apple Pay refund:', { transactionId, amount, reason });
    
    // Simulate refund processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      refundId: `applepay_refund_${uuidv4()}`,
      message: 'Apple Pay refund processed successfully'
    };
  }
}

// PayOS Gateway (Mock Implementation)
export class PayOSGateway implements PaymentGatewayInterface {
  private config = PAYMENT_CONFIG.PAYOS;
  
  async createPayment(paymentData: PayOSPaymentRequest): Promise<PayOSPaymentResponse> {
    try {
      console.log('💳 Processing PayOS payment:', {
        orderCode: paymentData.orderCode,
        amount: paymentData.amount,
        description: paymentData.description
      });
      
      // Mock validation
      if (!paymentData.orderCode || !paymentData.amount) {
        return {
          error: 1,
          message: 'Invalid order code or amount',
        };
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful response
      const mockResponse: PayOSPaymentResponse = {
        error: 0,
        message: 'Success',
        data: {
          bin: '970422',
          accountNumber: '19036225',
          accountName: 'NGUYEN VAN A',
          amount: paymentData.amount,
          description: paymentData.description,
          orderCode: paymentData.orderCode,
          currency: 'VND',
          paymentLinkId: `payos_link_${uuidv4()}`,
          status: 'PENDING',
          checkoutUrl: `https://pay.payos.vn/web/checkout/${paymentData.orderCode}`,
          qrCode: `https://img.vietqr.io/image/970422-19036225-qr_only.png?amount=${paymentData.amount}&addInfo=${encodeURIComponent(paymentData.description)}`
        }
      };
      
      return mockResponse;
    } catch (error: any) {
      return {
        error: 1,
        message: `PayOS error: ${error.message}`
      };
    }
  }
  
  async getPaymentStatus(orderCode: string): Promise<PaymentStatus> {
    console.log('💳 Checking PayOS status for:', orderCode);
    
    // Mock status check - simulate random statuses
    const statuses = [PaymentStatus.PENDING, PaymentStatus.COMPLETED, PaymentStatus.FAILED];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }
  
  async cancelPayment(orderCode: string): Promise<boolean> {
    console.log('💳 Cancelling PayOS payment:', orderCode);
    
    // Simulate cancellation
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  }
  
  async createRefund(orderCode: string, amount: number, reason: string): Promise<{
    success: boolean;
    refundId?: string;
    message: string;
  }> {
    console.log('💳 Creating PayOS refund:', { orderCode, amount, reason });
    
    // Simulate refund processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      refundId: `payos_refund_${uuidv4()}`,
      message: 'PayOS refund processed successfully'
    };
  }
}

// Mock Gateway for Testing
export class MockGateway implements PaymentGatewayInterface {
  private config = PAYMENT_CONFIG.MOCK_GATEWAY;
  
  async createPayment(paymentData: {
    amount: number;
    currency: string;
    description: string;
    customerEmail: string;
  }): Promise<{
    success: boolean;
    transactionId?: string;
    status: PaymentStatus;
    message: string;
    checkoutUrl?: string;
  }> {
    console.log('🧪 Processing Mock payment:', paymentData);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, this.config.PROCESSING_DELAY));
    
    // Simulate success/failure based on success rate
    const isSuccess = Math.random() < this.config.SUCCESS_RATE;
    
    if (isSuccess) {
      const transactionId = `mock_${uuidv4()}`;
      return {
        success: true,
        transactionId,
        status: PaymentStatus.COMPLETED,
        message: 'Mock payment processed successfully',
        checkoutUrl: `http://localhost:3005/mock-checkout/${transactionId}`
      };
    } else {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        message: 'Mock payment failed - simulated failure'
      };
    }
  }
  
  async getPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    console.log('🧪 Checking Mock payment status:', transactionId);
    
    // Simulate different statuses
    const statuses = [
      PaymentStatus.PENDING,
      PaymentStatus.PROCESSING,
      PaymentStatus.COMPLETED,
      PaymentStatus.FAILED
    ];
    
    return statuses[Math.floor(Math.random() * statuses.length)];
  }
  
  async cancelPayment(transactionId: string): Promise<boolean> {
    console.log('🧪 Cancelling Mock payment:', transactionId);
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  }
  
  async createRefund(transactionId: string, amount: number, reason: string): Promise<{
    success: boolean;
    refundId?: string;
    message: string;
  }> {
    console.log('🧪 Creating Mock refund:', { transactionId, amount, reason });
    
    // Simulate refund processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      refundId: `mock_refund_${uuidv4()}`,
      message: 'Mock refund processed successfully'
    };
  }
}

// Gateway Factory
export class PaymentGatewayFactory {
  static createGateway(gateway: PaymentGateway): PaymentGatewayInterface {
    switch (gateway) {
      case PaymentGateway.APPLE_PAY:
        return new ApplePayGateway();
      case PaymentGateway.PAYOS:
        return new PayOSGateway();
      case PaymentGateway.MOCK_GATEWAY:
        return new MockGateway();
      default:
        throw new Error(`Unsupported payment gateway: ${gateway}`);
    }
  }
}

// Webhook Simulator (for testing)
export class WebhookSimulator {
  static async simulateWebhook(
    paymentId: string,
    transactionId: string,
    gateway: PaymentGateway,
    status: PaymentStatus,
    amount: number
  ): Promise<WebhookData> {
    // Simulate delay before webhook
    setTimeout(async () => {
      const webhookData: WebhookData = {
        gateway,
        event_type: 'payment.status.changed',
        payment_id: paymentId,
        transaction_id: transactionId,
        status,
        amount,
        currency: 'VND',
        timestamp: new Date(),
        signature: `webhook_signature_${uuidv4()}`,
        raw_data: {
          gateway_specific_data: true,
          mock_webhook: true
        }
      };
      
      // Send webhook to payment service
      try {
        const webhookUrl = `http://localhost:3005/api/payments/webhook/${gateway.toLowerCase()}`;
        await axios.post(webhookUrl, webhookData);
        console.log(`🔔 Webhook sent for ${gateway}:`, webhookData);
      } catch (error) {
        console.error('Failed to send webhook:', error);
      }
    }, 3000); // 3 second delay
    
    return {} as WebhookData;
  }
}

export default {
  ApplePayGateway,
  PayOSGateway,
  MockGateway,
  PaymentGatewayFactory,
  WebhookSimulator
};