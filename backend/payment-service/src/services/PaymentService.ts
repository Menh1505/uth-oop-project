import pool from '../config/database';
import logger from '../config/logger';
import { Payment, PaymentRequest, Subscription, UserSubscription, SubscriptionCheckResponse } from '../models/Payment';

export class PaymentService {
  
  /**
   * Get all available subscription plans
   */
  async getSubscriptionPlans(): Promise<Subscription[]> {
    try {
      const result = await pool.query(`
        SELECT * FROM subscriptions 
        WHERE is_active = true 
        ORDER BY price ASC
      `);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching subscription plans:', error);
      throw new Error('Failed to fetch subscription plans');
    }
  }

  /**
   * Check if user has premium subscription
   */
  async checkUserSubscription(userId: number): Promise<SubscriptionCheckResponse> {
    try {
      const result = await pool.query(`
        SELECT us.*, s.type as subscription_type, s.features
        FROM user_subscriptions us
        JOIN subscriptions s ON us.subscription_id = s.id
        WHERE us.user_id = $1 AND us.is_active = true AND us.end_date > NOW()
        ORDER BY us.end_date DESC
        LIMIT 1
      `, [userId]);

      if (result.rows.length === 0) {
        return {
          is_premium: false,
          subscription: null,
          remaining_days: null
        };
      }

      const subscription = result.rows[0] as UserSubscription;
      const isPremium = result.rows[0].subscription_type === 'premium';
      const remainingDays = Math.ceil(
        (new Date(subscription.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        is_premium: isPremium,
        subscription,
        remaining_days: remainingDays
      };
    } catch (error) {
      logger.error('Error checking user subscription:', error);
      throw new Error('Failed to check subscription status');
    }
  }

  /**
   * Create a payment for subscription
   */
  async createPayment(userId: number, paymentRequest: PaymentRequest): Promise<Payment> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify subscription exists
      const subscriptionResult = await client.query(`
        SELECT * FROM subscriptions WHERE id = $1 AND is_active = true
      `, [paymentRequest.subscription_id]);

      if (subscriptionResult.rows.length === 0) {
        throw new Error('Invalid subscription plan');
      }

      const subscription = subscriptionResult.rows[0];

      // Verify amount matches subscription price
      if (paymentRequest.amount !== subscription.price) {
        throw new Error('Payment amount does not match subscription price');
      }

      // Create payment record
      const paymentResult = await client.query(`
        INSERT INTO payments (
          user_id, amount, currency, status, payment_method, transaction_id, gateway_response
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        userId,
        paymentRequest.amount,
        paymentRequest.currency,
        'pending',
        paymentRequest.payment_method,
        null,
        {}
      ]);

      const payment = paymentResult.rows[0];

      // Simulate payment processing (replace with actual gateway integration)
      const paymentSuccess = await this.processPaymentWithGateway(payment);

      if (paymentSuccess) {
        // Update payment status
        await client.query(`
          UPDATE payments 
          SET status = 'completed', transaction_id = $1, gateway_response = $2, updated_at = NOW()
          WHERE id = $3
        `, [`tx_${Date.now()}`, { status: 'success', gateway: 'payos' }, payment.id]);

        // Create or update user subscription
        await this.createUserSubscription(client, userId, paymentRequest.subscription_id, payment.id, subscription.duration_days);

        await client.query('COMMIT');
        
        // Return updated payment
        const updatedPayment = await pool.query('SELECT * FROM payments WHERE id = $1', [payment.id]);
        return updatedPayment.rows[0];
      } else {
        await client.query(`
          UPDATE payments 
          SET status = 'failed', gateway_response = $1, updated_at = NOW()
          WHERE id = $2
        `, [{ status: 'failed', gateway: 'payos' }, payment.id]);

        await client.query('COMMIT');
        throw new Error('Payment processing failed');
      }

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating payment:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get payment history for a user
   */
  async getUserPayments(userId: number): Promise<Payment[]> {
    try {
      const result = await pool.query(`
        SELECT p.*, s.type as subscription_type, s.duration_days
        FROM payments p
        LEFT JOIN user_subscriptions us ON p.id = us.payment_id
        LEFT JOIN subscriptions s ON us.subscription_id = s.id
        WHERE p.user_id = $1
        ORDER BY p.created_at DESC
      `, [userId]);

      return result.rows;
    } catch (error) {
      logger.error('Error fetching user payments:', error);
      throw new Error('Failed to fetch payment history');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: number): Promise<boolean> {
    try {
      const result = await pool.query(`
        UPDATE user_subscriptions 
        SET auto_renew = false, updated_at = NOW()
        WHERE user_id = $1 AND is_active = true AND end_date > NOW()
        RETURNING *
      `, [userId]);

      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Simulate payment processing with external gateway (PayOS)
   */
  private async processPaymentWithGateway(payment: Payment): Promise<boolean> {
    try {
      // Simulate PayOS API call
      // In real implementation, integrate with PayOS SDK
      logger.info(`Processing payment ${payment.id} via PayOS`);
      
      // Simulate 90% success rate
      const success = Math.random() > 0.1;
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      logger.info(`Payment ${payment.id} ${success ? 'completed' : 'failed'}`);
      return success;
    } catch (error) {
      logger.error('Gateway processing error:', error);
      return false;
    }
  }

  /**
   * Create user subscription after successful payment
   */
  private async createUserSubscription(
    client: any,
    userId: number,
    subscriptionId: number,
    paymentId: number,
    durationDays: number
  ): Promise<void> {
    // Deactivate existing subscriptions
    await client.query(`
      UPDATE user_subscriptions 
      SET is_active = false, updated_at = NOW()
      WHERE user_id = $1 AND is_active = true
    `, [userId]);

    // Create new subscription
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (durationDays * 24 * 60 * 60 * 1000));

    await client.query(`
      INSERT INTO user_subscriptions (
        user_id, subscription_id, payment_id, start_date, end_date, is_active, auto_renew
      ) VALUES ($1, $2, $3, $4, $5, true, true)
    `, [userId, subscriptionId, paymentId, startDate, endDate]);
  }
}