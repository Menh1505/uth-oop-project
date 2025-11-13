import { Router } from 'express';
import { DeliveryController } from '../controllers/DeliveryController';
import {
  authenticateToken,
  requireAdmin,
  requireDriver,
  requirePartner,
  requireCustomerOrAdmin,
  requireRoles,
  requireSelfOrAdmin,
  optionalAuth,
  checkDeliveryAccess
} from '../middleware/authMiddleware';
import {
  asyncHandler,
  validateRequest,
  validateCoordinates,
  requestTimeout
} from '../middleware/errorHandler';

export class DeliveryRoutes {
  private router: Router;
  private deliveryController: DeliveryController;

  constructor(deliveryController: DeliveryController) {
    this.router = Router();
    this.deliveryController = deliveryController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Apply global middleware
    this.router.use(requestTimeout(60000)); // 60 second timeout

    // ============= HEALTH & UTILITY ROUTES =============
    this.router.get('/health', 
      asyncHandler(this.deliveryController.healthCheck)
    );

    this.router.get('/enums', 
      optionalAuth,
      asyncHandler(this.deliveryController.getEnums)
    );

    // ============= DRIVER MANAGEMENT ROUTES =============
    
    // Create driver (Admin only)
    this.router.post('/drivers',
      authenticateToken,
      requireAdmin,
      validateRequest([
        'full_name', 'phone', 'email', 'vehicle_type', 
        'vehicle_plate', 'license_number', 'identity_number'
      ]),
      asyncHandler(this.deliveryController.createDriver)
    );

    // Get all drivers (Admin only)
    this.router.get('/drivers',
      authenticateToken,
      requireAdmin,
      asyncHandler(this.deliveryController.getDrivers)
    );

    // Get driver by ID (Admin or self)
    this.router.get('/drivers/:id',
      authenticateToken,
      requireSelfOrAdmin,
      asyncHandler(this.deliveryController.getDriverById)
    );

    // Update driver (Admin or self)
    this.router.put('/drivers/:id',
      authenticateToken,
      requireSelfOrAdmin,
      asyncHandler(this.deliveryController.updateDriver)
    );

    // Update driver location (Driver only)
    this.router.put('/drivers/:id/location',
      authenticateToken,
      requireDriver,
      validateCoordinates,
      asyncHandler(this.deliveryController.updateDriverLocation)
    );

    // Update driver status (Driver or Admin)
    this.router.put('/drivers/:id/status',
      authenticateToken,
      requireRoles(['driver', 'admin']),
      validateRequest(['status']),
      asyncHandler(this.deliveryController.updateDriverStatus)
    );

    // Get available drivers near location (Admin, Partner, or internal)
    this.router.get('/drivers/available',
      authenticateToken,
      requireRoles(['admin', 'partner']),
      asyncHandler(this.deliveryController.getAvailableDrivers)
    );

    // ============= DELIVERY MANAGEMENT ROUTES =============

    // Create delivery (Admin, Partner, or system)
    this.router.post('/deliveries',
      authenticateToken,
      requireRoles(['admin', 'partner', 'system']),
      validateRequest([
        'order_id', 'customer_id', 'restaurant_id', 'partner_id',
        'pickup_address', 'pickup_latitude', 'pickup_longitude',
        'pickup_contact_name', 'pickup_contact_phone',
        'delivery_address', 'delivery_latitude', 'delivery_longitude',
        'delivery_contact_name', 'delivery_contact_phone',
        'delivery_fee', 'payment_method', 'items_count'
      ]),
      validateCoordinates,
      asyncHandler(this.deliveryController.createDelivery)
    );

    // Get deliveries with filters (All authenticated users)
    this.router.get('/deliveries',
      authenticateToken,
      checkDeliveryAccess,
      asyncHandler(this.deliveryController.getDeliveries)
    );

    // Get delivery by ID (All authenticated users)
    this.router.get('/deliveries/:id',
      authenticateToken,
      checkDeliveryAccess,
      asyncHandler(this.deliveryController.getDeliveryById)
    );

    // Update delivery (Admin or Partner)
    this.router.put('/deliveries/:id',
      authenticateToken,
      requireRoles(['admin', 'partner']),
      asyncHandler(this.deliveryController.updateDelivery)
    );

    // Assign driver to delivery (Admin only)
    this.router.post('/deliveries/:id/assign',
      authenticateToken,
      requireAdmin,
      validateRequest(['driver_id']),
      asyncHandler(this.deliveryController.assignDriver)
    );

    // Auto-assign driver (Admin or system)
    this.router.post('/deliveries/:id/auto-assign',
      authenticateToken,
      requireRoles(['admin', 'system']),
      asyncHandler(this.deliveryController.autoAssignDriver)
    );

    // Update delivery proof (Driver only)
    this.router.put('/deliveries/:id/proof',
      authenticateToken,
      requireDriver,
      asyncHandler(this.deliveryController.updateDeliveryProof)
    );

    // ============= TRACKING ROUTES =============

    // Get tracking events for delivery
    this.router.get('/deliveries/:id/tracking',
      authenticateToken,
      checkDeliveryAccess,
      asyncHandler(this.deliveryController.getTrackingEvents)
    );

    // Create tracking event
    this.router.post('/deliveries/:id/tracking',
      authenticateToken,
      requireRoles(['driver', 'admin', 'system']),
      validateRequest(['event_type', 'description']),
      asyncHandler(this.deliveryController.createTrackingEvent)
    );

    // ============= ANALYTICS ROUTES =============

    // Get delivery analytics (Admin only)
    this.router.get('/analytics/deliveries',
      authenticateToken,
      requireAdmin,
      asyncHandler(this.deliveryController.getDeliveryAnalytics)
    );

    // Get driver analytics (Admin only)
    this.router.get('/analytics/drivers',
      authenticateToken,
      requireAdmin,
      asyncHandler(this.deliveryController.getDriverAnalytics)
    );

    // ============= INTEGRATION ROUTES =============

    // Handle order creation from order service (Internal)
    this.router.post('/integration/order-created',
      authenticateToken,
      requireRoles(['system', 'admin']),
      asyncHandler(this.deliveryController.handleOrderCreated)
    );

    // Calculate delivery fee (Public API)
    this.router.post('/integration/calculate-fee',
      optionalAuth,
      validateRequest([
        'pickup_latitude', 'pickup_longitude',
        'delivery_latitude', 'delivery_longitude'
      ]),
      validateCoordinates,
      asyncHandler(this.deliveryController.calculateDeliveryFee)
    );

    // ============= DRIVER MOBILE APP ROUTES =============

    // Get driver's deliveries
    this.router.get('/driver/:id/deliveries',
      authenticateToken,
      requireDriver,
      requireSelfOrAdmin,
      asyncHandler(this.deliveryController.getDriverDeliveries)
    );

    // Mark delivery as picked up
    this.router.put('/driver/:driverId/delivery/:deliveryId/pickup',
      authenticateToken,
      requireDriver,
      requireSelfOrAdmin,
      validateCoordinates,
      asyncHandler(this.deliveryController.markDeliveryPickedUp)
    );

    // Mark delivery as in transit
    this.router.put('/driver/:driverId/delivery/:deliveryId/in-transit',
      authenticateToken,
      requireDriver,
      requireSelfOrAdmin,
      validateCoordinates,
      asyncHandler(this.deliveryController.markDeliveryInTransit)
    );

    // Complete delivery
    this.router.put('/driver/:driverId/delivery/:deliveryId/complete',
      authenticateToken,
      requireDriver,
      requireSelfOrAdmin,
      asyncHandler(this.deliveryController.completeDelivery)
    );

    // Mark delivery as failed
    this.router.put('/driver/:driverId/delivery/:deliveryId/failed',
      authenticateToken,
      requireDriver,
      requireSelfOrAdmin,
      validateRequest(['failure_reason']),
      asyncHandler(this.deliveryController.markDeliveryFailed)
    );

    // ============= CUSTOMER ROUTES =============

    // Get customer's deliveries
    this.router.get('/customer/:id/deliveries',
      authenticateToken,
      requireCustomerOrAdmin,
      asyncHandler(this.deliveryController.getDeliveries)  // Will be filtered by customer_id
    );

    // Get customer's delivery tracking
    this.router.get('/customer/:customerId/delivery/:deliveryId/tracking',
      authenticateToken,
      requireCustomerOrAdmin,
      asyncHandler(this.deliveryController.getTrackingEvents)
    );

    // ============= PARTNER ROUTES =============

    // Get partner's deliveries
    this.router.get('/partner/:id/deliveries',
      authenticateToken,
      requireRoles(['partner', 'admin']),
      asyncHandler(this.deliveryController.getDeliveries)  // Will be filtered by partner_id
    );

    // Get partner's delivery analytics
    this.router.get('/partner/:id/analytics',
      authenticateToken,
      requireRoles(['partner', 'admin']),
      asyncHandler(this.deliveryController.getDeliveryAnalytics)
    );

    // ============= ADMIN ROUTES =============

    // Emergency override - cancel any delivery
    this.router.put('/admin/deliveries/:id/cancel',
      authenticateToken,
      requireAdmin,
      validateRequest(['reason']),
      asyncHandler(async (req: any, res: any, next: any) => {
        req.body.status = 'CANCELLED';
        req.body.failure_reason = req.body.reason;
        return this.deliveryController.updateDelivery(req, res, next);
      })
    );

    // Emergency override - reassign delivery
    this.router.put('/admin/deliveries/:id/reassign',
      authenticateToken,
      requireAdmin,
      validateRequest(['new_driver_id', 'reason']),
      asyncHandler(async (req: any, res: any, next: any) => {
        // First unassign current driver, then assign new one
        await this.deliveryController.updateDelivery(req, res, next);
        req.body.driver_id = req.body.new_driver_id;
        return this.deliveryController.assignDriver(req, res, next);
      })
    );

    // Suspend driver
    this.router.put('/admin/drivers/:id/suspend',
      authenticateToken,
      requireAdmin,
      validateRequest(['reason']),
      asyncHandler(async (req: any, res: any, next: any) => {
        req.body.status = 'SUSPENDED';
        return this.deliveryController.updateDriver(req, res, next);
      })
    );

    // Activate suspended driver
    this.router.put('/admin/drivers/:id/activate',
      authenticateToken,
      requireAdmin,
      asyncHandler(async (req: any, res: any, next: any) => {
        req.body.status = 'OFFLINE';
        return this.deliveryController.updateDriver(req, res, next);
      })
    );

    // Bulk operations for admin
    this.router.post('/admin/deliveries/bulk-assign',
      authenticateToken,
      requireAdmin,
      validateRequest(['delivery_ids']),
      asyncHandler(async (req: any, res: any, next: any) => {
        const { delivery_ids } = req.body;
        const results = [];
        
        for (const deliveryId of delivery_ids) {
          try {
            const result = await this.deliveryController.autoAssignDriver(
              { ...req, params: { id: deliveryId } }, 
              res, 
              next
            );
            results.push({ delivery_id: deliveryId, success: true, result });
          } catch (error) {
            results.push({ delivery_id: deliveryId, success: false, error: error });
          }
        }
        
        res.json({
          success: true,
          message: 'Bulk assignment completed',
          data: { results }
        });
      })
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}