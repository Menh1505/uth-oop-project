import { Request, Response } from 'express';
import { PaymentService } from '../services/PaymentService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { 
  CreatePaymentRequest, 
  UpdatePaymentRequest, 
  CreateRefundRequest,
  PaymentFilters,
  WebhookData,
  PaymentGateway
} from '../models/Payment';
import { PAYMENT_MESSAGES } from '../config/payment';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  // ============= PAYMENT CRUD OPERATIONS =============
  
  createPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const paymentData: CreatePaymentRequest = req.body;

      // Validate required fields
      if (!paymentData.payment_method || !paymentData.payment_gateway || 
          !paymentData.amount || !paymentData.customer_name || !paymentData.customer_email) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: payment_method, payment_gateway, amount, customer_name, customer_email'
        });
      }

      const payment = await this.paymentService.createPayment(userId, paymentData);
      
      res.status(201).json({
        success: true,
        data: payment,
        message: PAYMENT_MESSAGES.PAYMENT_CREATED
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to create payment',
        message: error.message
      });
    }
  };

  getPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const payment = await this.paymentService.getPaymentById(id, userId);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }

      res.json({
        success: true,
        data: payment
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get payment',
        message: error.message
      });
    }
  };

  getUserPayments = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const filters: PaymentFilters = {
        status: req.query.status as any,
        payment_method: req.query.payment_method as any,
        payment_gateway: req.query.payment_gateway as any,
        order_id: req.query.order_id as string,
        customer_email: req.query.customer_email as string,
        start_date: req.query.start_date ? new Date(req.query.start_date as string) : undefined,
        end_date: req.query.end_date ? new Date(req.query.end_date as string) : undefined,
        min_amount: req.query.min_amount ? parseFloat(req.query.min_amount as string) : undefined,
        max_amount: req.query.max_amount ? parseFloat(req.query.max_amount as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const payments = await this.paymentService.getUserPayments(userId, filters);
      
      res.json({
        success: true,
        data: payments,
        count: payments.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get payments',
        message: error.message
      });
    }
  };

  updatePayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const updateData: UpdatePaymentRequest = req.body;

      const payment = await this.paymentService.updatePayment(id, userId, updateData);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }

      res.json({
        success: true,
        data: payment,
        message: 'Payment updated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to update payment',
        message: error.message
      });
    }
  };

  cancelPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const payment = await this.paymentService.cancelPayment(id, userId);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }

      res.json({
        success: true,
        data: payment,
        message: PAYMENT_MESSAGES.PAYMENT_CANCELLED
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to cancel payment',
        message: error.message
      });
    }
  };

  // ============= REFUND MANAGEMENT =============
  
  createRefund = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const refundData: CreateRefundRequest = req.body;

      // Validate required fields
      if (!refundData.payment_id || !refundData.refund_amount || 
          !refundData.refund_reason || !refundData.refund_type) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: payment_id, refund_amount, refund_reason, refund_type'
        });
      }

      const refund = await this.paymentService.createRefund(userId, refundData);
      
      res.status(201).json({
        success: true,
        data: refund,
        message: PAYMENT_MESSAGES.REFUND_INITIATED
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to create refund',
        message: error.message
      });
    }
  };

  // ============= APPLE PAY SPECIFIC ENDPOINTS =============
  
  createApplePayPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { apple_pay_token, amount, currency, customer_name, customer_email, description, order_id } = req.body;

      if (!apple_pay_token || !amount || !customer_name || !customer_email) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields for Apple Pay: apple_pay_token, amount, customer_name, customer_email'
        });
      }

      const paymentData: CreatePaymentRequest = {
        order_id,
        payment_method: 'APPLE_PAY' as any,
        payment_gateway: 'APPLE_PAY' as any,
        amount,
        currency: currency || 'VND',
        customer_name,
        customer_email,
        description,
        apple_pay_token
      };

      const payment = await this.paymentService.createPayment(userId, paymentData);
      
      res.status(201).json({
        success: true,
        data: payment,
        message: 'Apple Pay payment created successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to process Apple Pay payment',
        message: error.message
      });
    }
  };

  // ============= PAYOS SPECIFIC ENDPOINTS =============
  
  createPayOSPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { order_code, amount, description, customer_name, customer_email, items, return_url, cancel_url } = req.body;

      if (!amount || !customer_name || !customer_email || !description) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields for PayOS: amount, customer_name, customer_email, description'
        });
      }

      const paymentData: CreatePaymentRequest = {
        payment_method: 'BANK_TRANSFER' as any,
        payment_gateway: 'PAYOS' as any,
        amount,
        currency: 'VND',
        customer_name,
        customer_email,
        description,
        return_url,
        cancel_url,
        payos_order_code: order_code,
        payos_items: items
      };

      const payment = await this.paymentService.createPayment(userId, paymentData);
      
      res.status(201).json({
        success: true,
        data: payment,
        message: 'PayOS payment created successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to process PayOS payment',
        message: error.message
      });
    }
  };

  // ============= WEBHOOK HANDLERS =============
  
  handleapplePayWebhook = async (req: Request, res: Response) => {
    try {
      const webhookData: WebhookData = {
        ...req.body,
        gateway: PaymentGateway.APPLE_PAY
      };

      const processed = await this.paymentService.processWebhook(webhookData);
      
      if (processed) {
        res.json({
          success: true,
          message: PAYMENT_MESSAGES.WEBHOOK_PROCESSED
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Failed to process webhook'
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Webhook processing error',
        message: error.message
      });
    }
  };

  handlePayOSWebhook = async (req: Request, res: Response) => {
    try {
      const webhookData: WebhookData = {
        ...req.body,
        gateway: PaymentGateway.PAYOS
      };

      const processed = await this.paymentService.processWebhook(webhookData);
      
      if (processed) {
        res.json({
          success: true,
          message: PAYMENT_MESSAGES.WEBHOOK_PROCESSED
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Failed to process PayOS webhook'
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'PayOS webhook processing error',
        message: error.message
      });
    }
  };

  handleMockWebhook = async (req: Request, res: Response) => {
    try {
      const webhookData: WebhookData = {
        ...req.body,
        gateway: PaymentGateway.MOCK_GATEWAY
      };

      const processed = await this.paymentService.processWebhook(webhookData);
      
      if (processed) {
        res.json({
          success: true,
          message: 'Mock webhook processed successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Failed to process mock webhook'
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Mock webhook processing error',
        message: error.message
      });
    }
  };

  // ============= ANALYTICS & REPORTING =============
  
  getPaymentStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;

      const stats = await this.paymentService.getPaymentStats(userId, startDate, endDate);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get payment statistics',
        message: error.message
      });
    }
  };

  // ============= ADMIN ENDPOINTS =============
  
  getAllPayments = async (req: AuthenticatedRequest, res: Response) => {
    try {
      // TODO: Add admin role check
      const filters: PaymentFilters = {
        status: req.query.status as any,
        payment_method: req.query.payment_method as any,
        payment_gateway: req.query.payment_gateway as any,
        customer_email: req.query.customer_email as string,
        start_date: req.query.start_date ? new Date(req.query.start_date as string) : undefined,
        end_date: req.query.end_date ? new Date(req.query.end_date as string) : undefined,
        min_amount: req.query.min_amount ? parseFloat(req.query.min_amount as string) : undefined,
        max_amount: req.query.max_amount ? parseFloat(req.query.max_amount as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      // Get all payments (admin view) - would need to modify service method
      const payments = await this.paymentService.getUserPayments('', filters); // Empty userId for admin
      
      res.json({
        success: true,
        data: payments,
        count: payments.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get all payments',
        message: error.message
      });
    }
  };

  getGlobalPaymentStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      // TODO: Add admin role check
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;

      const stats = await this.paymentService.getPaymentStats(undefined, startDate, endDate); // No userId for global stats
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get global payment statistics',
        message: error.message
      });
    }
  };

  // ============= MOCK PAYMENT ENDPOINTS (FOR TESTING) =============
  
  createMockPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { amount, currency, customer_name, customer_email, description, order_id } = req.body;

      if (!amount || !customer_name || !customer_email) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields for mock payment: amount, customer_name, customer_email'
        });
      }

      const paymentData: CreatePaymentRequest = {
        order_id,
        payment_method: 'CREDIT_CARD' as any,
        payment_gateway: 'MOCK_GATEWAY' as any,
        amount,
        currency: currency || 'VND',
        customer_name,
        customer_email,
        description: description || 'Mock payment for testing'
      };

      const payment = await this.paymentService.createPayment(userId, paymentData);
      
      res.status(201).json({
        success: true,
        data: payment,
        message: 'Mock payment created successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to create mock payment',
        message: error.message
      });
    }
  };

  // ============= HEALTH CHECK =============
  
  healthCheck = async (req: Request, res: Response) => {
    res.json({
      service: 'payment-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      gateways: {
        apple_pay: 'available',
        payos: 'available',
        mock_gateway: 'available'
      }
    });
  };
}