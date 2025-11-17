import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import logger from '../config/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    subscription?: any;
  };
}

export const checkPremiumSubscription = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const userId = req.user.id;
    const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3008';

    try {
      // Check subscription status with payment service
      const response = await axios.get(
        `${paymentServiceUrl}/api/payments/user/${userId}/subscription`,
        {
          timeout: 5000,
          headers: {
            Authorization: req.headers.authorization
          }
        }
      );

      const subscriptionData = response.data.data;

      if (!subscriptionData.is_premium) {
        res.status(403).json({
          success: false,
          message: 'Premium subscription required to access AI recommendations',
          subscription_status: {
            is_premium: false,
            upgrade_required: true,
            available_plans: `${process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3008'}/api/payments/plans`
          }
        });
        return;
      }

      // Add subscription info to request for later use
      req.user.subscription = subscriptionData;
      next();
    } catch (paymentServiceError: any) {
      logger.error('Error checking subscription with payment service:', paymentServiceError.message);
      
      // Fail open or closed based on configuration
      const failOpen = process.env.SUBSCRIPTION_CHECK_FAIL_OPEN === 'true';
      
      if (failOpen) {
        logger.warn('Payment service unavailable, allowing access (fail-open mode)');
        next();
      } else {
        res.status(503).json({
          success: false,
          message: 'Subscription verification service temporarily unavailable',
          error: 'Please try again later or contact support'
        });
      }
    }
  } catch (error: any) {
    logger.error('Error in premium subscription middleware:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error verifying subscription status'
    });
  }
};