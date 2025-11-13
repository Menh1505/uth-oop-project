import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { 
  Order, 
  OrderItem, 
  OrderStatus, 
  PaymentStatus,
  DeliveryType,
  OrderPriority,
  CreateOrderRequest, 
  UpdateOrderRequest, 
  OrderFilters,
  OrderWithItems,
  OrderSummary,
  OrderStats,
  OrderStatusHistory,
  ORDER_STATUS_TRANSITIONS
} from '../models/Order';

export class OrderService {
  
  // ============= ORDER MANAGEMENT =============
  
  async createOrder(userId: string, orderData: CreateOrderRequest): Promise<OrderWithItems> {
    const client = await require('../config/database').getClient();
    
    try {
      await client.query('BEGIN');
      
      // Generate unique order number
      const orderNumber = await this.generateOrderNumber();
      
      // Calculate totals
      const subtotal = orderData.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
      const taxAmount = subtotal * 0.1; // 10% tax
      const deliveryFee = orderData.delivery_type === DeliveryType.DELIVERY ? 25000 : 0; // 25k VND delivery fee
      const discountAmount = 0; // TODO: Apply coupon logic
      const totalAmount = subtotal + taxAmount + deliveryFee - discountAmount;
      
      // Validate delivery information
      if (orderData.delivery_type === DeliveryType.DELIVERY && !orderData.delivery_address) {
        throw new Error('Delivery address is required for delivery orders');
      }
      
      // Create order
      const orderId = uuidv4();
      const orderQuery = `
        INSERT INTO orders (
          id, user_id, restaurant_id, order_number, status, payment_status, 
          delivery_type, priority, subtotal, tax_amount, delivery_fee, 
          discount_amount, total_amount, customer_name, customer_phone, 
          customer_email, delivery_address, delivery_notes, delivery_time,
          estimated_prep_time, special_instructions, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW())
        RETURNING *
      `;
      
      const orderValues = [
        orderId, userId, orderData.restaurant_id, orderNumber, OrderStatus.PENDING, PaymentStatus.PENDING,
        orderData.delivery_type, orderData.priority || OrderPriority.NORMAL, subtotal, taxAmount, deliveryFee,
        discountAmount, totalAmount, orderData.customer_name, orderData.customer_phone,
        orderData.customer_email, orderData.delivery_address, orderData.delivery_notes,
        orderData.delivery_time ? new Date(orderData.delivery_time) : null,
        orderData.estimated_prep_time, orderData.special_instructions
      ];
      
      const orderResult = await client.query(orderQuery, orderValues);
      const order = orderResult.rows[0];
      
      // Create order items
      const items: OrderItem[] = [];
      for (const itemData of orderData.items) {
        const itemId = uuidv4();
        const totalPrice = itemData.unit_price * itemData.quantity;
        
        const itemQuery = `
          INSERT INTO order_items (
            id, order_id, product_id, product_name, product_description,
            category, unit_price, quantity, total_price, customizations,
            special_requests, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          RETURNING *
        `;
        
        const itemValues = [
          itemId, orderId, itemData.product_id, itemData.product_name,
          itemData.product_description, itemData.category, itemData.unit_price,
          itemData.quantity, totalPrice, JSON.stringify(itemData.customizations || []),
          itemData.special_requests
        ];
        
        const itemResult = await client.query(itemQuery, itemValues);
        items.push({
          ...itemResult.rows[0],
          customizations: itemData.customizations || []
        });
      }
      
      // Create initial status history
      await this.createStatusHistory(orderId, undefined, OrderStatus.PENDING, userId, 'Order created');
      
      await client.query('COMMIT');
      
      return {
        ...order,
        items
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async getOrderById(orderId: string, userId: string): Promise<OrderWithItems | null> {
    const orderQuery = `
      SELECT * FROM orders 
      WHERE id = $1 AND user_id = $2
    `;
    
    const orderResult = await query(orderQuery, [orderId, userId]);
    if (orderResult.rows.length === 0) {
      return null;
    }
    
    const order = orderResult.rows[0];
    
    // Get order items
    const itemsQuery = `
      SELECT * FROM order_items 
      WHERE order_id = $1 
      ORDER BY created_at ASC
    `;
    
    const itemsResult = await query(itemsQuery, [orderId]);
    const items = itemsResult.rows.map((item: any) => ({
      ...item,
      customizations: JSON.parse(item.customizations || '[]')
    }));
    
    return {
      ...order,
      items
    };
  }
  
  async getUserOrders(userId: string, filters: OrderFilters = {}): Promise<OrderSummary[]> {
    let whereConditions = ['user_id = $1'];
    let values: any[] = [userId];
    let paramCount = 1;
    
    // Apply filters
    if (filters.status) {
      whereConditions.push(`status = $${++paramCount}`);
      values.push(filters.status);
    }
    
    if (filters.payment_status) {
      whereConditions.push(`payment_status = $${++paramCount}`);
      values.push(filters.payment_status);
    }
    
    if (filters.delivery_type) {
      whereConditions.push(`delivery_type = $${++paramCount}`);
      values.push(filters.delivery_type);
    }
    
    if (filters.order_number) {
      whereConditions.push(`order_number ILIKE $${++paramCount}`);
      values.push(`%${filters.order_number}%`);
    }
    
    if (filters.start_date) {
      whereConditions.push(`created_at >= $${++paramCount}`);
      values.push(filters.start_date);
    }
    
    if (filters.end_date) {
      whereConditions.push(`created_at <= $${++paramCount}`);
      values.push(filters.end_date);
    }
    
    const orderQuery = `
      SELECT 
        o.id, o.order_number, o.status, o.payment_status, o.delivery_type,
        o.customer_name, o.customer_phone, o.total_amount, o.created_at,
        o.delivery_time as estimated_delivery_time,
        COUNT(oi.id)::integer as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY o.id, o.order_number, o.status, o.payment_status, o.delivery_type,
               o.customer_name, o.customer_phone, o.total_amount, o.created_at, o.delivery_time
      ORDER BY o.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    
    values.push(filters.limit || 50, filters.offset || 0);
    
    const result = await query(orderQuery, values);
    return result.rows;
  }
  
  async updateOrder(orderId: string, userId: string, updateData: UpdateOrderRequest): Promise<Order | null> {
    // Get current order
    const currentOrder = await this.getOrderById(orderId, userId);
    if (!currentOrder) {
      return null;
    }
    
    // Validate status transition if status is being updated
    if (updateData.status && !this.isValidStatusTransition(currentOrder.status, updateData.status)) {
      throw new Error(`Invalid status transition from ${currentOrder.status} to ${updateData.status}`);
    }
    
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;
    
    // Build dynamic update query
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${++paramCount}`);
        values.push(value);
      }
    });
    
    if (updateFields.length === 0) {
      return currentOrder;
    }
    
    updateFields.push(`updated_at = $${++paramCount}`);
    values.push(new Date());
    values.push(orderId);
    values.push(userId);
    
    const updateQuery = `
      UPDATE orders 
      SET ${updateFields.join(', ')}
      WHERE id = $${++paramCount} AND user_id = $${++paramCount}
      RETURNING *
    `;
    
    const result = await query(updateQuery, values);
    
    // Create status history if status changed
    if (updateData.status && updateData.status !== currentOrder.status) {
      await this.createStatusHistory(orderId, currentOrder.status, updateData.status, userId);
    }
    
    return result.rows[0] || null;
  }
  
  async deleteOrder(orderId: string, userId: string): Promise<boolean> {
    const client = await require('../config/database').getClient();
    
    try {
      await client.query('BEGIN');
      
      // Check if order can be deleted (only PENDING or CANCELLED orders)
      const orderCheck = await client.query(
        'SELECT status FROM orders WHERE id = $1 AND user_id = $2',
        [orderId, userId]
      );
      
      if (orderCheck.rows.length === 0) {
        return false;
      }
      
      const status = orderCheck.rows[0].status;
      if (status !== OrderStatus.PENDING && status !== OrderStatus.CANCELLED) {
        throw new Error('Only pending or cancelled orders can be deleted');
      }
      
      // Delete order items first
      await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
      
      // Delete status history
      await client.query('DELETE FROM order_status_history WHERE order_id = $1', [orderId]);
      
      // Delete order
      const deleteResult = await client.query(
        'DELETE FROM orders WHERE id = $1 AND user_id = $2',
        [orderId, userId]
      );
      
      await client.query('COMMIT');
      return deleteResult.rowCount > 0;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // ============= STATUS MANAGEMENT =============
  
  async updateOrderStatus(orderId: string, newStatus: OrderStatus, changedBy: string, reason?: string): Promise<Order | null> {
    const client = await require('../config/database').getClient();
    
    try {
      await client.query('BEGIN');
      
      // Get current order
      const orderResult = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
      if (orderResult.rows.length === 0) {
        return null;
      }
      
      const currentOrder = orderResult.rows[0];
      
      // Validate status transition
      if (!this.isValidStatusTransition(currentOrder.status, newStatus)) {
        throw new Error(`Invalid status transition from ${currentOrder.status} to ${newStatus}`);
      }
      
      // Update order status
      const updateQuery = `
        UPDATE orders 
        SET status = $1, updated_at = NOW(),
            ${newStatus === OrderStatus.CONFIRMED ? 'confirmed_at = NOW(),' : ''}
            ${newStatus === OrderStatus.CANCELLED ? 'cancelled_at = NOW(),' : ''}
            ${newStatus === OrderStatus.DELIVERED ? 'delivered_at = NOW(), actual_delivery_time = NOW()' : ''}
        WHERE id = $2
        RETURNING *
      `;
      
      const updatedOrder = await client.query(updateQuery.replace(/,\s*$/, ''), [newStatus, orderId]);
      
      // Create status history
      await this.createStatusHistory(orderId, currentOrder.status, newStatus, changedBy, reason);
      
      await client.query('COMMIT');
      return updatedOrder.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async getOrderStatusHistory(orderId: string): Promise<OrderStatusHistory[]> {
    const query_text = `
      SELECT * FROM order_status_history 
      WHERE order_id = $1 
      ORDER BY created_at ASC
    `;
    
    const result = await query(query_text, [orderId]);
    return result.rows;
  }
  
  private async createStatusHistory(
    orderId: string, 
    previousStatus: OrderStatus | undefined, 
    newStatus: OrderStatus, 
    changedBy: string, 
    reason?: string
  ): Promise<void> {
    const historyQuery = `
      INSERT INTO order_status_history (id, order_id, previous_status, new_status, changed_by, reason, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `;
    
    await query(historyQuery, [
      uuidv4(), orderId, previousStatus, newStatus, changedBy, reason
    ]);
  }
  
  private isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }
  
  // ============= ANALYTICS & REPORTING =============
  
  async getOrderStats(userId?: string, startDate?: Date, endDate?: Date): Promise<OrderStats> {
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
        COUNT(*)::integer as total_orders,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END)::integer as pending_orders,
        COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END)::integer as confirmed_orders,
        COUNT(CASE WHEN status = 'PREPARING' THEN 1 END)::integer as preparing_orders,
        COUNT(CASE WHEN status = 'READY' THEN 1 END)::integer as ready_orders,
        COUNT(CASE WHEN status = 'OUT_FOR_DELIVERY' THEN 1 END)::integer as out_for_delivery_orders,
        COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END)::integer as delivered_orders,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END)::integer as cancelled_orders,
        COALESCE(SUM(CASE WHEN status = 'DELIVERED' THEN total_amount ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN status = 'DELIVERED' THEN total_amount END), 0) as average_order_value,
        COALESCE(AVG(estimated_prep_time), 0) as average_prep_time
      FROM orders
      WHERE ${whereConditions.join(' AND ')}
    `;
    
    const result = await query(statsQuery, values);
    return result.rows[0];
  }
  
  // ============= UTILITY METHODS =============
  
  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    
    // Get today's order count
    const countQuery = `
      SELECT COUNT(*) as order_count 
      FROM orders 
      WHERE DATE(created_at) = CURRENT_DATE
    `;
    
    const result = await query(countQuery);
    const orderCount = parseInt(result.rows[0].order_count) + 1;
    
    return `ORD${datePrefix}${orderCount.toString().padStart(4, '0')}`;
  }
  
  async cancelOrder(orderId: string, userId: string, reason?: string): Promise<Order | null> {
    return this.updateOrderStatus(orderId, OrderStatus.CANCELLED, userId, reason);
  }
  
  async confirmOrder(orderId: string, adminId: string): Promise<Order | null> {
    return this.updateOrderStatus(orderId, OrderStatus.CONFIRMED, adminId, 'Order confirmed by admin');
  }
  
  async markOrderReady(orderId: string, staffId: string): Promise<Order | null> {
    return this.updateOrderStatus(orderId, OrderStatus.READY, staffId, 'Order ready for pickup/delivery');
  }
  
  async markOrderDelivered(orderId: string, deliveryPersonId: string): Promise<Order | null> {
    return this.updateOrderStatus(orderId, OrderStatus.DELIVERED, deliveryPersonId, 'Order delivered successfully');
  }
}