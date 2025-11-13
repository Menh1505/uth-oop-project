import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { 
  CreateOrderRequest, 
  UpdateOrderRequest, 
  OrderFilters,
  OrderStatus
} from '../models/Order';

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  // ============= ORDER CRUD OPERATIONS =============
  
  createOrder = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const orderData: CreateOrderRequest = req.body;

      // Validate required fields
      if (!orderData.customer_name || !orderData.customer_phone || !orderData.items || orderData.items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: customer_name, customer_phone, items'
        });
      }

      const order = await this.orderService.createOrder(userId, orderData);
      
      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to create order',
        message: error.message
      });
    }
  };

  getOrder = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const order = await this.orderService.getOrderById(id, userId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get order',
        message: error.message
      });
    }
  };

  getUserOrders = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const filters: OrderFilters = {
        status: req.query.status as any,
        payment_status: req.query.payment_status as any,
        delivery_type: req.query.delivery_type as any,
        order_number: req.query.order_number as string,
        start_date: req.query.start_date ? new Date(req.query.start_date as string) : undefined,
        end_date: req.query.end_date ? new Date(req.query.end_date as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const orders = await this.orderService.getUserOrders(userId, filters);
      
      res.json({
        success: true,
        data: orders,
        count: orders.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get orders',
        message: error.message
      });
    }
  };

  updateOrder = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const updateData: UpdateOrderRequest = req.body;

      const order = await this.orderService.updateOrder(id, userId, updateData);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: order,
        message: 'Order updated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to update order',
        message: error.message
      });
    }
  };

  deleteOrder = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const deleted = await this.orderService.deleteOrder(id, userId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Order not found or cannot be deleted'
        });
      }

      res.json({
        success: true,
        message: 'Order deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete order',
        message: error.message
      });
    }
  };

  // ============= ORDER STATUS MANAGEMENT =============
  
  updateOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const userId = req.user!.userId;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Status is required'
        });
      }

      const order = await this.orderService.updateOrderStatus(id, status, userId, reason);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: order,
        message: `Order status updated to ${status}`
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to update order status',
        message: error.message
      });
    }
  };

  getOrderStatusHistory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      // First check if user owns the order
      const order = await this.orderService.getOrderById(id, userId);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      const history = await this.orderService.getOrderStatusHistory(id);
      
      res.json({
        success: true,
        data: history
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get order status history',
        message: error.message
      });
    }
  };

  // ============= QUICK STATUS ACTIONS =============
  
  cancelOrder = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user!.userId;

      const order = await this.orderService.cancelOrder(id, userId, reason);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: order,
        message: 'Order cancelled successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to cancel order',
        message: error.message
      });
    }
  };

  confirmOrder = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const order = await this.orderService.confirmOrder(id, userId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: order,
        message: 'Order confirmed successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to confirm order',
        message: error.message
      });
    }
  };

  markOrderReady = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const order = await this.orderService.markOrderReady(id, userId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: order,
        message: 'Order marked as ready'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to mark order as ready',
        message: error.message
      });
    }
  };

  markOrderDelivered = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const order = await this.orderService.markOrderDelivered(id, userId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: order,
        message: 'Order marked as delivered'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to mark order as delivered',
        message: error.message
      });
    }
  };

  // ============= ANALYTICS & REPORTING =============
  
  getOrderStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;

      const stats = await this.orderService.getOrderStats(userId, startDate, endDate);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get order statistics',
        message: error.message
      });
    }
  };

  // ============= ADMIN ENDPOINTS =============
  
  getAllOrders = async (req: AuthenticatedRequest, res: Response) => {
    try {
      // TODO: Add admin role check
      const filters: OrderFilters = {
        status: req.query.status as any,
        payment_status: req.query.payment_status as any,
        delivery_type: req.query.delivery_type as any,
        restaurant_id: req.query.restaurant_id as string,
        customer_phone: req.query.customer_phone as string,
        order_number: req.query.order_number as string,
        start_date: req.query.start_date ? new Date(req.query.start_date as string) : undefined,
        end_date: req.query.end_date ? new Date(req.query.end_date as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      // Get all orders (admin view) - would need to modify service method
      const orders = await this.orderService.getUserOrders('', filters); // Empty userId for admin
      
      res.json({
        success: true,
        data: orders,
        count: orders.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get all orders',
        message: error.message
      });
    }
  };

  getGlobalOrderStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      // TODO: Add admin role check
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;

      const stats = await this.orderService.getOrderStats(undefined, startDate, endDate); // No userId for global stats
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get global order statistics',
        message: error.message
      });
    }
  };

  // ============= HEALTH CHECK =============
  
  healthCheck = async (req: Request, res: Response) => {
    res.json({
      service: 'order-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  };
}