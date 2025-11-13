import { v4 as uuidv4 } from 'uuid';
import { query, getClient } from '../config/database';
import { 
  Payment, 
  Transaction,
  RefundRequest,
  PaymentStatus, 
  PaymentMethod,
  PaymentGateway,
  RefundStatus,
  TransactionType,
  CreatePaymentRequest, 
  UpdatePaymentRequest, 
  CreateRefundRequest,
  PaymentFilters,
  PaymentWithDetails,
  PaymentSummary,
  PaymentStats,
  WebhookData
} from '../models/Payment';
import { PAYMENT_CONFIG, PAYMENT_ERRORS, PAYMENT_MESSAGES } from '../config/payment';
import { PaymentGatewayFactory, WebhookSimulator } from '../gateways/PaymentGateways';

export class PaymentService {
  
  // ============= PAYMENT MANAGEMENT =============
  
  async createPayment(userId: string, paymentData: CreatePaymentRequest): Promise<PaymentWithDetails> {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Validate payment amount
      this.validatePaymentAmount(paymentData.amount);
      
      // Calculate fees and net amount
      const feeAmount = this.calculateFee(paymentData.amount, paymentData.payment_gateway);
      const netAmount = paymentData.amount - feeAmount;
      
      // Create payment record
      const paymentId = uuidv4();
      const referenceCode = this.generateReferenceCode();
      const expiredAt = new Date(Date.now() + PAYMENT_CONFIG.GENERAL.PAYMENT_TIMEOUT);
      
      const paymentQuery = `
        INSERT INTO payments (
          id, user_id, order_id, payment_method, payment_gateway, status,
          amount, currency, fee_amount, net_amount, customer_name,
          customer_email, customer_phone, description, reference_code,
          return_url, cancel_url, expired_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
        RETURNING *
      `;
      
      const paymentValues = [
        paymentId, userId, paymentData.order_id, paymentData.payment_method,
        paymentData.payment_gateway, PaymentStatus.PENDING, paymentData.amount,
        paymentData.currency || PAYMENT_CONFIG.GENERAL.DEFAULT_CURRENCY, feeAmount, netAmount,
        paymentData.customer_name, paymentData.customer_email, paymentData.customer_phone,
        paymentData.description, referenceCode, paymentData.return_url, paymentData.cancel_url,
        expiredAt
      ];
      
      const paymentResult = await client.query(paymentQuery, paymentValues);
      const payment = paymentResult.rows[0];
      
      // Create initial transaction record
      const transactionId = uuidv4();
      const transactionQuery = `
        INSERT INTO transactions (
          id, payment_id, type, status, amount, currency, fee_amount,
          description, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `;
      
      const transactionValues = [
        transactionId, paymentId, TransactionType.PAYMENT, PaymentStatus.PENDING,
        paymentData.amount, paymentData.currency || 'VND', feeAmount,
        'Initial payment transaction'
      ];
      
      const transactionResult = await client.query(transactionQuery, transactionValues);
      const transaction = transactionResult.rows[0];
      
      // Process payment with gateway
      let gatewayResponse;
      try {
        gatewayResponse = await this.processPaymentWithGateway(payment, paymentData);
        
        // Update payment with gateway response
        await client.query(
          `UPDATE payments SET 
           gateway_transaction_id = $1, 
           gateway_payment_url = $2, 
           gateway_response = $3,
           updated_at = NOW()
           WHERE id = $4`,
          [
            gatewayResponse.transactionId,
            gatewayResponse.checkoutUrl || gatewayResponse.paymentUrl,
            JSON.stringify(gatewayResponse),
            paymentId
          ]
        );
        
        // Update transaction with gateway info
        await client.query(
          `UPDATE transactions SET 
           gateway_transaction_id = $1,
           gateway_response = $2,
           updated_at = NOW()
           WHERE id = $3`,
          [gatewayResponse.transactionId, JSON.stringify(gatewayResponse), transactionId]
        );
        
      } catch (gatewayError: any) {
        console.error('Gateway processing error:', gatewayError);
        // Update payment status to failed
        await client.query(
          'UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2',
          [PaymentStatus.FAILED, paymentId]
        );
      }
      
      await client.query('COMMIT');
      
      // Get updated payment with details
      const updatedPayment = await this.getPaymentById(paymentId, userId);
      return updatedPayment!;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async getPaymentById(paymentId: string, userId: string): Promise<PaymentWithDetails | null> {
    const paymentQuery = `
      SELECT * FROM payments 
      WHERE id = $1 AND user_id = $2
    `;
    
    const paymentResult = await query(paymentQuery, [paymentId, userId]);
    if (paymentResult.rows.length === 0) {
      return null;
    }
    
    const payment = paymentResult.rows[0];
    
    // Get associated transactions
    const transactionsQuery = `
      SELECT * FROM transactions 
      WHERE payment_id = $1 
      ORDER BY created_at DESC
    `;
    
    const transactionsResult = await query(transactionsQuery, [paymentId]);
    const transactions = transactionsResult.rows;
    
    // Get refund requests
    const refundsQuery = `
      SELECT * FROM refund_requests 
      WHERE payment_id = $1 
      ORDER BY created_at DESC
    `;
    
    const refundsResult = await query(refundsQuery, [paymentId]);
    const refundRequests = refundsResult.rows;
    
    return {
      ...payment,
      gateway_response: payment.gateway_response ? JSON.parse(payment.gateway_response) : null,
      transactions,
      refund_requests: refundRequests
    };
  }
  
  async getUserPayments(userId: string, filters: PaymentFilters = {}): Promise<PaymentSummary[]> {
    let whereConditions = ['user_id = $1'];
    let values: any[] = [userId];
    let paramCount = 1;
    
    // Apply filters
    if (filters.status) {
      whereConditions.push(`status = $${++paramCount}`);
      values.push(filters.status);
    }
    
    if (filters.payment_method) {
      whereConditions.push(`payment_method = $${++paramCount}`);
      values.push(filters.payment_method);
    }
    
    if (filters.payment_gateway) {
      whereConditions.push(`payment_gateway = $${++paramCount}`);
      values.push(filters.payment_gateway);
    }
    
    if (filters.order_id) {
      whereConditions.push(`order_id = $${++paramCount}`);
      values.push(filters.order_id);
    }
    
    if (filters.customer_email) {
      whereConditions.push(`customer_email ILIKE $${++paramCount}`);
      values.push(`%${filters.customer_email}%`);
    }
    
    if (filters.start_date) {
      whereConditions.push(`created_at >= $${++paramCount}`);
      values.push(filters.start_date);
    }
    
    if (filters.end_date) {
      whereConditions.push(`created_at <= $${++paramCount}`);
      values.push(filters.end_date);
    }
    
    if (filters.min_amount) {
      whereConditions.push(`amount >= $${++paramCount}`);
      values.push(filters.min_amount);
    }
    
    if (filters.max_amount) {
      whereConditions.push(`amount <= $${++paramCount}`);
      values.push(filters.max_amount);
    }
    
    const paymentQuery = `
      SELECT 
        id, order_id, payment_method, payment_gateway, status,
        amount, currency, customer_name, customer_email,
        description, created_at, completed_at
      FROM payments
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    
    values.push(filters.limit || 50, filters.offset || 0);
    
    const result = await query(paymentQuery, values);
    return result.rows;
  }
  
  async updatePayment(paymentId: string, userId: string, updateData: UpdatePaymentRequest): Promise<Payment | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;
    
    // Build dynamic update query
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${++paramCount}`);
        values.push(typeof value === 'object' ? JSON.stringify(value) : value);
      }
    });
    
    if (updateFields.length === 0) {
      const current = await this.getPaymentById(paymentId, userId);
      return current;
    }
    
    updateFields.push(`updated_at = $${++paramCount}`);
    values.push(new Date());
    values.push(paymentId);
    values.push(userId);
    
    const updateQuery = `
      UPDATE payments 
      SET ${updateFields.join(', ')}
      WHERE id = $${++paramCount} AND user_id = $${++paramCount}
      RETURNING *
    `;
    
    const result = await query(updateQuery, values);
    return result.rows[0] || null;
  }
  
  // ============= PAYMENT PROCESSING =============
  
  private async processPaymentWithGateway(payment: Payment, paymentData: CreatePaymentRequest): Promise<any> {
    const gateway = PaymentGatewayFactory.createGateway(payment.payment_gateway);
    
    switch (payment.payment_gateway) {
      case PaymentGateway.APPLE_PAY:
        return await gateway.createPayment({
          amount: payment.amount,
          currency: payment.currency,
          applePayToken: paymentData.apple_pay_token!,
          merchantId: paymentData.apple_pay_merchant_id || PAYMENT_CONFIG.APPLE_PAY.MERCHANT_ID,
          description: payment.description || 'Payment'
        });
        
      case PaymentGateway.PAYOS:
        return await gateway.createPayment({
          orderCode: paymentData.payos_order_code || payment.reference_code!,
          amount: payment.amount,
          description: payment.description || 'Payment',
          items: paymentData.payos_items || [{ name: 'Payment', quantity: 1, price: payment.amount }],
          cancelUrl: payment.cancel_url || 'http://localhost:3000/payment/cancel',
          returnUrl: payment.return_url || 'http://localhost:3000/payment/success'
        });
        
      case PaymentGateway.MOCK_GATEWAY:
        return await gateway.createPayment({
          amount: payment.amount,
          currency: payment.currency,
          description: payment.description || 'Payment',
          customerEmail: payment.customer_email
        });
        
      default:
        throw new Error(`Unsupported payment gateway: ${payment.payment_gateway}`);
    }
  }
  
  // ============= REFUND MANAGEMENT =============
  
  async createRefund(userId: string, refundData: CreateRefundRequest): Promise<RefundRequest> {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Get original payment
      const originalPayment = await this.getPaymentById(refundData.payment_id, userId);
      if (!originalPayment) {
        throw new Error('Payment not found');
      }
      
      // Validate refund
      this.validateRefundRequest(originalPayment, refundData);
      
      // Create refund request
      const refundId = uuidv4();
      const refundQuery = `
        INSERT INTO refund_requests (
          id, payment_id, user_id, status, refund_amount, refund_reason,
          refund_type, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `;
      
      const refundValues = [
        refundId, refundData.payment_id, userId, RefundStatus.PENDING,
        refundData.refund_amount, refundData.refund_reason, refundData.refund_type
      ];
      
      const refundResult = await client.query(refundQuery, refundValues);
      const refund = refundResult.rows[0];
      
      // Process refund with gateway
      try {
        const gateway = PaymentGatewayFactory.createGateway(originalPayment.payment_gateway);
        const gatewayResponse = await gateway.createRefund(
          originalPayment.gateway_transaction_id!,
          refundData.refund_amount,
          refundData.refund_reason
        );
        
        // Update refund with gateway response
        await client.query(
          `UPDATE refund_requests SET 
           gateway_refund_id = $1,
           gateway_response = $2,
           status = $3,
           updated_at = NOW()
           WHERE id = $4`,
          [
            gatewayResponse.refundId,
            JSON.stringify(gatewayResponse),
            gatewayResponse.success ? RefundStatus.PROCESSING : RefundStatus.FAILED,
            refundId
          ]
        );
        
        // Create refund transaction
        const transactionId = uuidv4();
        await client.query(
          `INSERT INTO transactions (
            id, payment_id, type, status, amount, currency, fee_amount,
            reference_payment_id, description, gateway_transaction_id,
            gateway_response, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
          [
            transactionId, refundData.payment_id, TransactionType.REFUND,
            gatewayResponse.success ? PaymentStatus.PROCESSING : PaymentStatus.FAILED,
            refundData.refund_amount, originalPayment.currency, 0,
            originalPayment.id, `Refund: ${refundData.refund_reason}`,
            gatewayResponse.refundId, JSON.stringify(gatewayResponse)
          ]
        );
        
      } catch (gatewayError: any) {
        console.error('Gateway refund error:', gatewayError);
        await client.query(
          'UPDATE refund_requests SET status = $1, updated_at = NOW() WHERE id = $2',
          [RefundStatus.FAILED, refundId]
        );
      }
      
      await client.query('COMMIT');
      return refund;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // ============= WEBHOOK HANDLING =============
  
  async processWebhook(webhookData: WebhookData): Promise<boolean> {
    try {
      console.log('Processing webhook:', webhookData);
      
      // Find payment by gateway transaction ID
      const paymentQuery = `
        SELECT * FROM payments 
        WHERE gateway_transaction_id = $1
      `;
      
      const paymentResult = await query(paymentQuery, [webhookData.transaction_id]);
      if (paymentResult.rows.length === 0) {
        console.warn('Payment not found for webhook:', webhookData.transaction_id);
        return false;
      }
      
      const payment = paymentResult.rows[0];
      
      // Update payment status
      await query(
        `UPDATE payments SET 
         status = $1,
         updated_at = NOW(),
         ${webhookData.status === PaymentStatus.COMPLETED ? 'completed_at = NOW(),' : ''}
         ${webhookData.status === PaymentStatus.FAILED ? 'failed_at = NOW(),' : ''}
         gateway_response = $2
         WHERE id = $3`,
        [webhookData.status, JSON.stringify(webhookData.raw_data), payment.id]
      );
      
      // Create transaction record for webhook
      const transactionId = uuidv4();
      await query(
        `INSERT INTO transactions (
          id, payment_id, type, status, amount, currency, fee_amount,
          description, gateway_transaction_id, gateway_response,
          created_at, updated_at, processed_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW())`,
        [
          transactionId, payment.id, TransactionType.PAYMENT, webhookData.status,
          webhookData.amount, webhookData.currency, 0,
          `Webhook update: ${webhookData.event_type}`,
          webhookData.transaction_id, JSON.stringify(webhookData.raw_data)
        ]
      );
      
      console.log(`Payment ${payment.id} updated to status: ${webhookData.status}`);
      return true;
      
    } catch (error) {
      console.error('Webhook processing error:', error);
      return false;
    }
  }
  
  // ============= ANALYTICS & REPORTING =============
  
  async getPaymentStats(userId?: string, startDate?: Date, endDate?: Date): Promise<PaymentStats> {
    let whereConditions = ['1=1'];
    let values: any[] = [];
    let paramCount = 0;
    
    if (userId) {
      whereConditions.push(`user_id = $${++paramCount}`);
      values.push(userId);
    }
    
    if (startDate) {
      whereConditions.push(`created_at >= $${++paramCount}`);
      values.push(startDate);
    }
    
    if (endDate) {
      whereConditions.push(`created_at <= $${++paramCount}`);
      values.push(endDate);
    }
    
    const statsQuery = `
      SELECT 
        COUNT(*)::integer as total_payments,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::integer as successful_payments,
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END)::integer as failed_payments,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END)::integer as pending_payments,
        COUNT(CASE WHEN status = 'REFUNDED' THEN 1 END)::integer as refunded_payments,
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END), 0) as total_amount,
        COALESCE(SUM(CASE WHEN status = 'REFUNDED' THEN amount ELSE 0 END), 0) as total_refunded,
        COALESCE(AVG(CASE WHEN status = 'COMPLETED' THEN amount END), 0) as average_payment_amount,
        CASE 
          WHEN COUNT(*) > 0 THEN 
            ROUND((COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 2)
          ELSE 0 
        END as success_rate,
        COUNT(CASE WHEN payment_gateway = 'APPLE_PAY' THEN 1 END)::integer as apple_pay_count,
        COALESCE(SUM(CASE WHEN payment_gateway = 'APPLE_PAY' AND status = 'COMPLETED' THEN amount ELSE 0 END), 0) as apple_pay_amount,
        COUNT(CASE WHEN payment_gateway = 'PAYOS' THEN 1 END)::integer as payos_count,
        COALESCE(SUM(CASE WHEN payment_gateway = 'PAYOS' AND status = 'COMPLETED' THEN amount ELSE 0 END), 0) as payos_amount,
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN fee_amount ELSE 0 END), 0) as total_fees,
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN net_amount ELSE 0 END), 0) as net_revenue
      FROM payments
      WHERE ${whereConditions.join(' AND ')}
    `;
    
    const result = await query(statsQuery, values);
    return result.rows[0];
  }
  
  // ============= UTILITY METHODS =============
  
  private validatePaymentAmount(amount: number): void {
    if (amount < PAYMENT_CONFIG.GENERAL.MIN_AMOUNT) {
      throw new Error(PAYMENT_ERRORS.AMOUNT_TOO_LOW);
    }
    
    if (amount > PAYMENT_CONFIG.GENERAL.MAX_AMOUNT) {
      throw new Error(PAYMENT_ERRORS.AMOUNT_TOO_HIGH);
    }
  }
  
  private calculateFee(amount: number, gateway: PaymentGateway): number {
    // Different fee structures for different gateways
    const feePercentage = PAYMENT_CONFIG.GENERAL.FEE_PERCENTAGE;
    return Math.round(amount * feePercentage);
  }
  
  private generateReferenceCode(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAY${timestamp.slice(-6)}${random}`;
  }
  
  private validateRefundRequest(payment: Payment, refundData: CreateRefundRequest): void {
    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new Error('Only completed payments can be refunded');
    }
    
    if (refundData.refund_amount > payment.amount) {
      throw new Error(PAYMENT_ERRORS.REFUND_AMOUNT_EXCEEDED);
    }
    
    // Check if refund is within allowed timeframe
    const paymentAge = Date.now() - new Date(payment.completed_at!).getTime();
    if (paymentAge > PAYMENT_CONFIG.GENERAL.REFUND_TIMEOUT) {
      throw new Error('Refund period has expired');
    }
  }
  
  async cancelPayment(paymentId: string, userId: string): Promise<Payment | null> {
    const payment = await this.getPaymentById(paymentId, userId);
    if (!payment) {
      return null;
    }
    
    if (payment.status !== PaymentStatus.PENDING && payment.status !== PaymentStatus.PROCESSING) {
      throw new Error('Only pending or processing payments can be cancelled');
    }
    
    // Cancel with gateway if transaction exists
    if (payment.gateway_transaction_id) {
      const gateway = PaymentGatewayFactory.createGateway(payment.payment_gateway);
      await gateway.cancelPayment(payment.gateway_transaction_id);
    }
    
    return await this.updatePayment(paymentId, userId, { status: PaymentStatus.CANCELLED });
  }
}