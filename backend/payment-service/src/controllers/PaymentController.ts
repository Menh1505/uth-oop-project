import { Request, Response } from 'express';
import { PaymentService } from '../services/PaymentService';
import { PaymentRequest } from '../models/Payment';
import logger from '../config/logger';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  /**
   * Get available subscription plans
   */
  getSubscriptionPlans = async (req: Request, res: Response): Promise<void> => {
    try {
      const plans = await this.paymentService.getSubscriptionPlans();
      res.json({
        success: true,
        data: plans
      });
    } catch (error) {
      logger.error('Error in getSubscriptionPlans:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subscription plans',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Check user's subscription status
   */
  checkSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      const subscriptionStatus = await this.paymentService.checkUserSubscription(userId);
      res.json({
        success: true,
        data: subscriptionStatus
      });
    } catch (error) {
      logger.error('Error in checkSubscription:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check subscription status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Create a payment for subscription
   */
  createPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      const paymentRequest: PaymentRequest = req.body;

      // Validate payment request
      if (!paymentRequest.amount || !paymentRequest.currency || !paymentRequest.subscription_id || !paymentRequest.payment_method) {
        res.status(400).json({
          success: false,
          message: 'Missing required payment fields'
        });
        return;
      }

      const payment = await this.paymentService.createPayment(userId, paymentRequest);
      
      res.status(201).json({
        success: true,
        data: payment,
        message: 'Payment processed successfully'
      });
    } catch (error) {
      logger.error('Error in createPayment:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Payment processing failed'
      });
    }
  };

  /**
   * Get payment history for user
   */
  getPaymentHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      const payments = await this.paymentService.getUserPayments(userId);
      res.json({
        success: true,
        data: payments
      });
    } catch (error) {
      logger.error('Error in getPaymentHistory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment history',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Cancel user subscription
   */
  cancelSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      const cancelled = await this.paymentService.cancelSubscription(userId);
      
      if (cancelled) {
        res.json({
          success: true,
          message: 'Subscription cancelled successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'No active subscription found to cancel'
        });
      }
    } catch (error) {
      logger.error('Error in cancelSubscription:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel subscription',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Health check endpoint
   */
  healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json({
        success: true,
        service: 'payment-service',
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        service: 'payment-service',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}