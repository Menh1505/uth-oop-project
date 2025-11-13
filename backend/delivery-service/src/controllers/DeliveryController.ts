import { Request, Response, NextFunction } from 'express';
import { DeliveryService } from '../services/DeliveryService';
import {
  CreateDriverRequest,
  UpdateDriverRequest,
  CreateDeliveryRequest,
  UpdateDeliveryRequest,
  CreateTrackingEventRequest,
  DeliveryProofRequest,
  UpdateDriverLocationRequest,
  DriverFilters,
  DeliveryFilters,
  TrackingEventFilters,
  DriverStatus,
  DeliveryStatus,
  DeliveryPriority,
  VehicleType,
  PaymentMethod
} from '../models/Delivery';

export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  // ============= DRIVER ENDPOINTS =============

  /**
   * POST /api/drivers
   * Create a new driver
   */
  createDriver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const driverData: CreateDriverRequest = {
        full_name: req.body.full_name,
        phone: req.body.phone,
        email: req.body.email,
        vehicle_type: req.body.vehicle_type,
        vehicle_plate: req.body.vehicle_plate,
        vehicle_model: req.body.vehicle_model,
        vehicle_color: req.body.vehicle_color,
        license_number: req.body.license_number,
        license_expiry: new Date(req.body.license_expiry),
        identity_number: req.body.identity_number,
        zone_coverage: req.body.zone_coverage || [],
        working_start_time: req.body.working_start_time,
        working_end_time: req.body.working_end_time,
        working_days: req.body.working_days || [],
        commission_rate: req.body.commission_rate
      };

      // Validate required fields
      const requiredFields = ['full_name', 'phone', 'email', 'vehicle_type', 'vehicle_plate', 'license_number', 'identity_number'];
      for (const field of requiredFields) {
        if (!req.body[field]) {
          res.status(400).json({
            success: false,
            message: `Field '${field}' is required`,
            error: 'VALIDATION_ERROR'
          });
          return;
        }
      }

      // Validate vehicle type
      if (!Object.values(VehicleType).includes(driverData.vehicle_type)) {
        res.status(400).json({
          success: false,
          message: 'Invalid vehicle type',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      const driver = await this.deliveryService.createDriver(driverData);
      
      res.status(201).json({
        success: true,
        message: 'Driver created successfully',
        data: { driver }
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * GET /api/drivers/:id
   * Get driver by ID
   */
  getDriverById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      const driver = await this.deliveryService.getDriverById(id);
      
      if (!driver) {
        res.status(404).json({
          success: false,
          message: 'Driver not found',
          error: 'DRIVER_NOT_FOUND'
        });
        return;
      }

      res.json({
        success: true,
        data: { driver }
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * GET /api/drivers
   * Get drivers with filters and pagination
   */
  getDrivers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters: DriverFilters = {
        status: req.query.status as DriverStatus,
        vehicle_type: req.query.vehicle_type as VehicleType,
        zone: req.query.zone as string,
        available_only: req.query.available_only === 'true',
        rating_min: req.query.rating_min ? parseFloat(req.query.rating_min as string) : undefined,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const result = await this.deliveryService.getDrivers(filters);
      
      res.json({
        success: true,
        data: result,
        pagination: {
          total: result.total,
          limit: filters.limit || 50,
          offset: filters.offset || 0,
          has_next: (filters.offset || 0) + (filters.limit || 50) < result.total
        }
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * PUT /api/drivers/:id
   * Update driver information
   */
  updateDriver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateDriverRequest = req.body;

      // Validate vehicle type if provided
      if (updateData.vehicle_type && !Object.values(VehicleType).includes(updateData.vehicle_type)) {
        res.status(400).json({
          success: false,
          message: 'Invalid vehicle type',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      // Validate status if provided
      if (updateData.status && !Object.values(DriverStatus).includes(updateData.status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid driver status',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      const driver = await this.deliveryService.updateDriver(id, updateData);
      
      res.json({
        success: true,
        message: 'Driver updated successfully',
        data: { driver }
      });
    } catch (error: any) {
      if (error.message === 'Driver not found') {
        res.status(404).json({
          success: false,
          message: 'Driver not found',
          error: 'DRIVER_NOT_FOUND'
        });
        return;
      }
      next(error);
    }
  };

  /**
   * PUT /api/drivers/:id/location
   * Update driver location
   */
  updateDriverLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const locationData: UpdateDriverLocationRequest = {
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        heading: req.body.heading,
        speed: req.body.speed,
        accuracy: req.body.accuracy
      };

      // Validate coordinates
      if (!locationData.latitude || !locationData.longitude) {
        res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      if (locationData.latitude < -90 || locationData.latitude > 90) {
        res.status(400).json({
          success: false,
          message: 'Invalid latitude value',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      if (locationData.longitude < -180 || locationData.longitude > 180) {
        res.status(400).json({
          success: false,
          message: 'Invalid longitude value',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      await this.deliveryService.updateDriverLocation(id, locationData);
      
      res.json({
        success: true,
        message: 'Driver location updated successfully'
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * PUT /api/drivers/:id/status
   * Update driver status
   */
  updateDriverStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !Object.values(DriverStatus).includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Valid status is required',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      await this.deliveryService.updateDriverStatus(id, status);
      
      res.json({
        success: true,
        message: 'Driver status updated successfully'
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * GET /api/drivers/available
   * Get available drivers near a location
   */
  getAvailableDrivers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { lat, lng, max_distance, max_assignment_time } = req.query;

      if (!lat || !lng) {
        res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      const criteria = {
        max_distance: max_distance ? parseFloat(max_distance as string) : 10,
        max_assignment_time: max_assignment_time ? parseInt(max_assignment_time as string) : 15,
        prefer_high_rating: true,
        consider_current_load: true,
        zone_restriction: false
      };

      const availableDrivers = await this.deliveryService.getAvailableDrivers(
        parseFloat(lat as string),
        parseFloat(lng as string),
        criteria
      );
      
      res.json({
        success: true,
        data: { drivers: availableDrivers },
        criteria
      });
    } catch (error: any) {
      next(error);
    }
  };

  // ============= DELIVERY ENDPOINTS =============

  /**
   * POST /api/deliveries
   * Create a new delivery
   */
  createDelivery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deliveryData: CreateDeliveryRequest = {
        order_id: req.body.order_id,
        customer_id: req.body.customer_id,
        restaurant_id: req.body.restaurant_id,
        partner_id: req.body.partner_id,
        priority: req.body.priority,
        pickup_address: req.body.pickup_address,
        pickup_latitude: req.body.pickup_latitude,
        pickup_longitude: req.body.pickup_longitude,
        pickup_contact_name: req.body.pickup_contact_name,
        pickup_contact_phone: req.body.pickup_contact_phone,
        pickup_instructions: req.body.pickup_instructions,
        delivery_address: req.body.delivery_address,
        delivery_latitude: req.body.delivery_latitude,
        delivery_longitude: req.body.delivery_longitude,
        delivery_contact_name: req.body.delivery_contact_name,
        delivery_contact_phone: req.body.delivery_contact_phone,
        delivery_instructions: req.body.delivery_instructions,
        estimated_pickup_time: req.body.estimated_pickup_time ? new Date(req.body.estimated_pickup_time) : undefined,
        estimated_delivery_time: req.body.estimated_delivery_time ? new Date(req.body.estimated_delivery_time) : undefined,
        delivery_window_start: req.body.delivery_window_start ? new Date(req.body.delivery_window_start) : undefined,
        delivery_window_end: req.body.delivery_window_end ? new Date(req.body.delivery_window_end) : undefined,
        delivery_fee: req.body.delivery_fee,
        payment_method: req.body.payment_method,
        cash_to_collect: req.body.cash_to_collect,
        items_count: req.body.items_count,
        total_weight: req.body.total_weight,
        special_instructions: req.body.special_instructions
      };

      // Validate required fields
      const requiredFields = [
        'order_id', 'customer_id', 'restaurant_id', 'partner_id',
        'pickup_address', 'pickup_latitude', 'pickup_longitude', 'pickup_contact_name', 'pickup_contact_phone',
        'delivery_address', 'delivery_latitude', 'delivery_longitude', 'delivery_contact_name', 'delivery_contact_phone',
        'delivery_fee', 'payment_method', 'items_count'
      ];

      for (const field of requiredFields) {
        if (req.body[field] === undefined || req.body[field] === null) {
          res.status(400).json({
            success: false,
            message: `Field '${field}' is required`,
            error: 'VALIDATION_ERROR'
          });
          return;
        }
      }

      // Validate coordinates
      if (deliveryData.pickup_latitude < -90 || deliveryData.pickup_latitude > 90 ||
          deliveryData.pickup_longitude < -180 || deliveryData.pickup_longitude > 180) {
        res.status(400).json({
          success: false,
          message: 'Invalid pickup coordinates',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      if (deliveryData.delivery_latitude < -90 || deliveryData.delivery_latitude > 90 ||
          deliveryData.delivery_longitude < -180 || deliveryData.delivery_longitude > 180) {
        res.status(400).json({
          success: false,
          message: 'Invalid delivery coordinates',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      // Validate payment method
      if (!Object.values(PaymentMethod).includes(deliveryData.payment_method)) {
        res.status(400).json({
          success: false,
          message: 'Invalid payment method',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      // Validate priority if provided
      if (deliveryData.priority && !Object.values(DeliveryPriority).includes(deliveryData.priority)) {
        res.status(400).json({
          success: false,
          message: 'Invalid delivery priority',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      const delivery = await this.deliveryService.createDelivery(deliveryData);
      
      res.status(201).json({
        success: true,
        message: 'Delivery created successfully',
        data: { delivery }
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * GET /api/deliveries/:id
   * Get delivery by ID
   */
  getDeliveryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      const delivery = await this.deliveryService.getDeliveryById(id);
      
      if (!delivery) {
        res.status(404).json({
          success: false,
          message: 'Delivery not found',
          error: 'DELIVERY_NOT_FOUND'
        });
        return;
      }

      res.json({
        success: true,
        data: { delivery }
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * GET /api/deliveries
   * Get deliveries with filters and pagination
   */
  getDeliveries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters: DeliveryFilters = {
        status: req.query.status as DeliveryStatus,
        driver_id: req.query.driver_id as string,
        customer_id: req.query.customer_id as string,
        restaurant_id: req.query.restaurant_id as string,
        partner_id: req.query.partner_id as string,
        priority: req.query.priority as DeliveryPriority,
        payment_method: req.query.payment_method as PaymentMethod,
        date_from: req.query.date_from ? new Date(req.query.date_from as string) : undefined,
        date_to: req.query.date_to ? new Date(req.query.date_to as string) : undefined,
        zone: req.query.zone as string,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const result = await this.deliveryService.getDeliveries(filters);
      
      res.json({
        success: true,
        data: result,
        pagination: {
          total: result.total,
          limit: filters.limit || 50,
          offset: filters.offset || 0,
          has_next: (filters.offset || 0) + (filters.limit || 50) < result.total
        }
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * PUT /api/deliveries/:id
   * Update delivery information
   */
  updateDelivery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateDeliveryRequest = req.body;

      // Validate status if provided
      if (updateData.status && !Object.values(DeliveryStatus).includes(updateData.status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid delivery status',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      // Validate priority if provided
      if (updateData.priority && !Object.values(DeliveryPriority).includes(updateData.priority)) {
        res.status(400).json({
          success: false,
          message: 'Invalid delivery priority',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      const delivery = await this.deliveryService.updateDelivery(id, updateData);
      
      res.json({
        success: true,
        message: 'Delivery updated successfully',
        data: { delivery }
      });
    } catch (error: any) {
      if (error.message === 'Delivery not found') {
        res.status(404).json({
          success: false,
          message: 'Delivery not found',
          error: 'DELIVERY_NOT_FOUND'
        });
        return;
      }
      next(error);
    }
  };

  /**
   * POST /api/deliveries/:id/assign
   * Assign driver to delivery
   */
  assignDriver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { driver_id } = req.body;

      if (!driver_id) {
        res.status(400).json({
          success: false,
          message: 'Driver ID is required',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      const assignment = await this.deliveryService.assignDriverToDelivery(id, driver_id);
      
      res.json({
        success: true,
        message: 'Driver assigned successfully',
        data: { assignment }
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message,
          error: 'NOT_FOUND'
        });
        return;
      }
      
      if (error.message.includes('not available') || error.message.includes('not assignable')) {
        res.status(400).json({
          success: false,
          message: error.message,
          error: 'ASSIGNMENT_ERROR'
        });
        return;
      }
      
      next(error);
    }
  };

  /**
   * POST /api/deliveries/:id/auto-assign
   * Auto-assign best available driver
   */
  autoAssignDriver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await this.deliveryService.autoAssignDriver(id);
      
      if (result.assignment_score === 0) {
        res.status(400).json({
          success: false,
          message: result.reason,
          error: 'AUTO_ASSIGNMENT_FAILED',
          data: { result }
        });
        return;
      }

      res.json({
        success: true,
        message: 'Driver auto-assigned successfully',
        data: { result }
      });
    } catch (error: any) {
      if (error.message === 'Delivery not found') {
        res.status(404).json({
          success: false,
          message: 'Delivery not found',
          error: 'DELIVERY_NOT_FOUND'
        });
        return;
      }
      next(error);
    }
  };

  /**
   * PUT /api/deliveries/:id/proof
   * Update delivery proof (completion)
   */
  updateDeliveryProof = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const proofData: DeliveryProofRequest = {
        delivery_photo_url: req.body.delivery_photo_url,
        delivery_signature: req.body.delivery_signature,
        delivery_notes: req.body.delivery_notes,
        customer_present: req.body.customer_present,
        delivered_to: req.body.delivered_to
      };

      await this.deliveryService.updateDeliveryProof(id, proofData);
      
      res.json({
        success: true,
        message: 'Delivery proof updated successfully'
      });
    } catch (error: any) {
      next(error);
    }
  };

  // ============= TRACKING ENDPOINTS =============

  /**
   * GET /api/deliveries/:id/tracking
   * Get tracking events for a delivery
   */
  getTrackingEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const events = await this.deliveryService.getTrackingEvents(id);
      
      res.json({
        success: true,
        data: { events }
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * POST /api/deliveries/:id/tracking
   * Create a tracking event
   */
  createTrackingEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const eventData: CreateTrackingEventRequest = {
        delivery_id: id,
        event_type: req.body.event_type,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        address: req.body.address,
        description: req.body.description,
        notes: req.body.notes,
        photo_url: req.body.photo_url
      };

      // Validate required fields
      if (!eventData.event_type || !eventData.description) {
        res.status(400).json({
          success: false,
          message: 'Event type and description are required',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      const event = await this.deliveryService.createTrackingEvent(eventData);
      
      res.status(201).json({
        success: true,
        message: 'Tracking event created successfully',
        data: { event }
      });
    } catch (error: any) {
      next(error);
    }
  };

  // ============= ANALYTICS ENDPOINTS =============

  /**
   * GET /api/analytics/deliveries
   * Get delivery analytics
   */
  getDeliveryAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dateFrom = req.query.date_from ? new Date(req.query.date_from as string) : undefined;
      const dateTo = req.query.date_to ? new Date(req.query.date_to as string) : undefined;

      const analytics = await this.deliveryService.getDeliveryAnalytics(dateFrom, dateTo);
      
      res.json({
        success: true,
        data: { analytics },
        filters: { date_from: dateFrom, date_to: dateTo }
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * GET /api/analytics/drivers
   * Get driver analytics
   */
  getDriverAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const analytics = await this.deliveryService.getDriverAnalytics();
      
      res.json({
        success: true,
        data: { analytics }
      });
    } catch (error: any) {
      next(error);
    }
  };

  // ============= UTILITY ENDPOINTS =============

  /**
   * GET /api/enums
   * Get all enum values for frontend
   */
  getEnums = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({
        success: true,
        data: {
          delivery_status: Object.values(DeliveryStatus),
          driver_status: Object.values(DriverStatus),
          delivery_priority: Object.values(DeliveryPriority),
          vehicle_type: Object.values(VehicleType),
          payment_method: Object.values(PaymentMethod)
        }
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * GET /api/health
   * Health check endpoint
   */
  healthCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({
        success: true,
        message: 'Delivery service is running',
        timestamp: new Date().toISOString(),
        service: 'delivery-service',
        version: '1.0.0'
      });
    } catch (error: any) {
      next(error);
    }
  };

  // ============= INTEGRATION ENDPOINTS =============

  /**
   * POST /api/integration/order-created
   * Handle order creation from order service
   */
  handleOrderCreated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orderData = req.body;

      // Create delivery from order data
      const deliveryData: CreateDeliveryRequest = {
        order_id: orderData.order_id,
        customer_id: orderData.customer_id,
        restaurant_id: orderData.restaurant_id,
        partner_id: orderData.partner_id,
        priority: orderData.priority || DeliveryPriority.NORMAL,
        pickup_address: orderData.restaurant_address,
        pickup_latitude: orderData.restaurant_latitude,
        pickup_longitude: orderData.restaurant_longitude,
        pickup_contact_name: orderData.restaurant_name,
        pickup_contact_phone: orderData.restaurant_phone,
        pickup_instructions: orderData.pickup_instructions,
        delivery_address: orderData.delivery_address,
        delivery_latitude: orderData.delivery_latitude,
        delivery_longitude: orderData.delivery_longitude,
        delivery_contact_name: orderData.customer_name,
        delivery_contact_phone: orderData.customer_phone,
        delivery_instructions: orderData.delivery_instructions,
        delivery_fee: orderData.delivery_fee,
        payment_method: orderData.payment_method,
        cash_to_collect: orderData.cash_to_collect,
        items_count: orderData.items_count,
        total_weight: orderData.total_weight,
        special_instructions: orderData.special_instructions
      };

      const delivery = await this.deliveryService.createDelivery(deliveryData);
      
      res.status(201).json({
        success: true,
        message: 'Delivery created from order',
        data: { delivery }
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * POST /api/integration/calculate-fee
   * Calculate delivery fee for an order
   */
  calculateDeliveryFee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { 
        pickup_latitude, 
        pickup_longitude, 
        delivery_latitude, 
        delivery_longitude,
        items_count,
        total_weight,
        priority,
        delivery_time 
      } = req.body;

      // Validate coordinates
      if (!pickup_latitude || !pickup_longitude || !delivery_latitude || !delivery_longitude) {
        res.status(400).json({
          success: false,
          message: 'All coordinates are required',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      // Calculate distance (simplified)
      const R = 6371; // Earth's radius in kilometers
      const dLat = (delivery_latitude - pickup_latitude) * Math.PI / 180;
      const dLon = (delivery_longitude - pickup_longitude) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(pickup_latitude * Math.PI / 180) * Math.cos(delivery_latitude * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      // Calculate fees
      const baseFee = 2.50; // Base delivery fee
      const distanceFee = distance * 0.80; // Per km
      const weightFee = (total_weight || 0) > 5 ? (total_weight - 5) * 0.50 : 0; // Extra weight
      const itemsFee = (items_count || 0) > 5 ? (items_count - 5) * 0.25 : 0; // Extra items
      
      // Priority multiplier
      let priorityMultiplier = 1.0;
      if (priority === DeliveryPriority.HIGH) priorityMultiplier = 1.2;
      if (priority === DeliveryPriority.URGENT) priorityMultiplier = 1.5;

      // Time-based surge (peak hours)
      const hour = new Date().getHours();
      const isRushHour = (hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21);
      const surgeMultiplier = isRushHour ? 1.25 : 1.0;

      const subtotal = (baseFee + distanceFee + weightFee + itemsFee) * priorityMultiplier;
      const totalFee = subtotal * surgeMultiplier;

      res.json({
        success: true,
        data: {
          base_fee: baseFee,
          distance_fee: distanceFee,
          weight_fee: weightFee,
          items_fee: itemsFee,
          priority_multiplier: priorityMultiplier,
          surge_multiplier: surgeMultiplier,
          subtotal: Math.round(subtotal * 100) / 100,
          total_fee: Math.round(totalFee * 100) / 100,
          distance_km: Math.round(distance * 100) / 100,
          estimated_duration: Math.ceil((distance / 25) * 60), // minutes
          currency: 'USD'
        }
      });
    } catch (error: any) {
      next(error);
    }
  };

  // ============= DRIVER MOBILE APP ENDPOINTS =============

  /**
   * GET /api/driver/:id/deliveries
   * Get deliveries assigned to driver
   */
  getDriverDeliveries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.query;

      const filters: DeliveryFilters = {
        driver_id: id,
        status: status as DeliveryStatus,
        limit: 50
      };

      const result = await this.deliveryService.getDeliveries(filters);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * PUT /api/driver/:driverId/delivery/:deliveryId/pickup
   * Mark delivery as picked up
   */
  markDeliveryPickedUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { deliveryId } = req.params;
      const { latitude, longitude, notes } = req.body;

      await this.deliveryService.updateDelivery(deliveryId, {
        status: DeliveryStatus.PICKED_UP,
        failure_reason: undefined
      });

      // Create tracking event
      await this.deliveryService.createTrackingEvent({
        delivery_id: deliveryId,
        event_type: 'ORDER_PICKED_UP' as any,
        latitude,
        longitude,
        description: 'Order picked up from restaurant',
        notes
      });

      res.json({
        success: true,
        message: 'Delivery marked as picked up'
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * PUT /api/driver/:driverId/delivery/:deliveryId/in-transit
   * Mark delivery as in transit
   */
  markDeliveryInTransit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { deliveryId } = req.params;
      const { latitude, longitude, notes } = req.body;

      await this.deliveryService.updateDelivery(deliveryId, {
        status: DeliveryStatus.IN_TRANSIT
      });

      // Create tracking event
      await this.deliveryService.createTrackingEvent({
        delivery_id: deliveryId,
        event_type: 'EN_ROUTE_TO_CUSTOMER' as any,
        latitude,
        longitude,
        description: 'Delivery in transit to customer',
        notes
      });

      res.json({
        success: true,
        message: 'Delivery marked as in transit'
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * PUT /api/driver/:driverId/delivery/:deliveryId/complete
   * Complete delivery with proof
   */
  completeDelivery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { deliveryId } = req.params;
      
      const proofData: DeliveryProofRequest = {
        delivery_photo_url: req.body.delivery_photo_url,
        delivery_signature: req.body.delivery_signature,
        delivery_notes: req.body.delivery_notes,
        customer_present: req.body.customer_present,
        delivered_to: req.body.delivered_to
      };

      await this.deliveryService.updateDeliveryProof(deliveryId, proofData);

      res.json({
        success: true,
        message: 'Delivery completed successfully'
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * PUT /api/driver/:driverId/delivery/:deliveryId/failed
   * Mark delivery as failed
   */
  markDeliveryFailed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { deliveryId } = req.params;
      const { failure_reason, latitude, longitude, notes } = req.body;

      if (!failure_reason) {
        res.status(400).json({
          success: false,
          message: 'Failure reason is required',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      await this.deliveryService.updateDelivery(deliveryId, {
        status: DeliveryStatus.FAILED,
        failure_reason
      });

      // Create tracking event
      await this.deliveryService.createTrackingEvent({
        delivery_id: deliveryId,
        event_type: 'DELIVERY_FAILED' as any,
        latitude,
        longitude,
        description: 'Delivery failed',
        notes: `Reason: ${failure_reason}. ${notes || ''}`
      });

      res.json({
        success: true,
        message: 'Delivery marked as failed'
      });
    } catch (error: any) {
      next(error);
    }
  };
}