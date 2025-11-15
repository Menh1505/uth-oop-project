import { Pool } from 'pg';
import {
  Driver,
  Delivery,
  DeliveryAssignment,
  TrackingEvent,
  DeliveryRoute,
  DeliveryZone,
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
  DeliveryAnalytics,
  DriverAnalytics,
  RouteOptimization,
  DriverAvailability,
  AssignmentCriteria,
  AssignmentResult,
  LocationUpdate,
  DeliveryStatusUpdate,
  DriverStatusUpdate,
  DeliveryStatus,
  DriverStatus,
  VehicleType,
  DeliveryPriority,
  TrackingEventType,
  PaymentMethod
} from '../models/Delivery';

export class DeliveryService {
  constructor(private db: Pool) {}

  // ============= DRIVER MANAGEMENT =============

  async createDriver(driverData: CreateDriverRequest): Promise<Driver> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Generate unique driver code
      const driverCode = await this.generateDriverCode();

      const query = `
        INSERT INTO drivers (
          driver_code, full_name, phone, email, status,
          vehicle_type, vehicle_plate, vehicle_model, vehicle_color,
          license_number, license_expiry, identity_number,
          zone_coverage, working_start_time, working_end_time, working_days,
          rating, total_deliveries, successful_deliveries, 
          average_delivery_time, total_distance,
          commission_rate, earnings_today, earnings_this_month,
          last_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
        ) RETURNING *
      `;

      const values = [
        driverCode,
        driverData.full_name,
        driverData.phone,
        driverData.email,
        DriverStatus.OFFLINE,
        driverData.vehicle_type,
        driverData.vehicle_plate,
        driverData.vehicle_model || null,
        driverData.vehicle_color || null,
        driverData.license_number,
        driverData.license_expiry,
        driverData.identity_number,
        JSON.stringify(driverData.zone_coverage),
        driverData.working_start_time,
        driverData.working_end_time,
        JSON.stringify(driverData.working_days),
        5.0, // Default rating
        0, // total_deliveries
        0, // successful_deliveries
        0, // average_delivery_time
        0, // total_distance
        driverData.commission_rate || 0.15,
        0, // earnings_today
        0, // earnings_this_month
        new Date(),
        new Date(),
        new Date()
      ];

      const result = await client.query(query, values);
      await client.query('COMMIT');

      return this.mapDriverFromDB(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getDriverById(driverId: string): Promise<Driver | null> {
    const query = 'SELECT * FROM drivers WHERE id = $1';
    const result = await this.db.query(query, [driverId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDriverFromDB(result.rows[0]);
  }

  async updateDriver(driverId: string, updateData: UpdateDriverRequest): Promise<Driver> {
    const driver = await this.getDriverById(driverId);
    if (!driver) {
      throw new Error('Driver not found');
    }

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'zone_coverage' || key === 'working_days') {
          updateFields.push(`${key} = $${paramIndex}`);
          updateValues.push(JSON.stringify(value));
        } else {
          updateFields.push(`${key} = $${paramIndex}`);
          updateValues.push(value);
        }
        paramIndex++;
      }
    });

    updateFields.push(`updated_at = $${paramIndex}`);
    updateValues.push(new Date());
    updateValues.push(driverId);

    const query = `
      UPDATE drivers 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await this.db.query(query, updateValues);
    return this.mapDriverFromDB(result.rows[0]);
  }

  async updateDriverLocation(driverId: string, locationData: UpdateDriverLocationRequest): Promise<void> {
    const query = `
      UPDATE drivers 
      SET current_latitude = $1, current_longitude = $2, 
          last_location_update = $3, last_active = $4, updated_at = $5
      WHERE id = $6
    `;

    await this.db.query(query, [
      locationData.latitude,
      locationData.longitude,
      new Date(),
      new Date(),
      new Date(),
      driverId
    ]);

    // Emit real-time location update
    this.emitLocationUpdate({
      driver_id: driverId,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      heading: locationData.heading,
      speed: locationData.speed,
      timestamp: new Date(),
      accuracy: locationData.accuracy
    });
  }

  async updateDriverStatus(driverId: string, status: DriverStatus): Promise<void> {
    const updateData: any = { status, updated_at: new Date() };
    
    if (status === DriverStatus.AVAILABLE || status === DriverStatus.BUSY) {
      updateData.online_since = new Date();
    }
    
    if (status === DriverStatus.OFFLINE) {
      updateData.online_since = null;
    }

    const query = `
      UPDATE drivers 
      SET status = $1, online_since = $2, updated_at = $3
      WHERE id = $4
    `;

    await this.db.query(query, [
      status,
      updateData.online_since,
      updateData.updated_at,
      driverId
    ]);

    // Emit real-time status update
    const driver = await this.getDriverById(driverId);
    if (driver) {
      this.emitDriverStatusUpdate({
        driver_id: driverId,
        status,
        location: driver.current_latitude && driver.current_longitude ? {
          latitude: driver.current_latitude,
          longitude: driver.current_longitude
        } : undefined,
        timestamp: new Date()
      });
    }
  }

  async getDrivers(filters: DriverFilters = {}): Promise<{ drivers: Driver[], total: number }> {
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (filters.status) {
      whereClause += ` AND status = $${paramIndex}`;
      queryParams.push(filters.status);
      paramIndex++;
    }

    if (filters.vehicle_type) {
      whereClause += ` AND vehicle_type = $${paramIndex}`;
      queryParams.push(filters.vehicle_type);
      paramIndex++;
    }

    if (filters.zone) {
      whereClause += ` AND zone_coverage::text LIKE $${paramIndex}`;
      queryParams.push(`%${filters.zone}%`);
      paramIndex++;
    }

    if (filters.available_only) {
      whereClause += ` AND status IN ('AVAILABLE', 'ON_DELIVERY')`;
    }

    if (filters.rating_min) {
      whereClause += ` AND rating >= $${paramIndex}`;
      queryParams.push(filters.rating_min);
      paramIndex++;
    }

    if (filters.search) {
      whereClause += ` AND (full_name ILIKE $${paramIndex} OR phone ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      queryParams.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Count query
    const countQuery = `SELECT COUNT(*) FROM drivers ${whereClause}`;
    const countResult = await this.db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Main query with pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const query = `
      SELECT * FROM drivers 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const result = await this.db.query(query, queryParams);

    const drivers = result.rows.map(row => this.mapDriverFromDB(row));

    return { drivers, total };
  }

  async getAvailableDrivers(
    pickupLat: number, 
    pickupLng: number, 
    criteria: AssignmentCriteria = {
      max_distance: 10,
      max_assignment_time: 15,
      prefer_high_rating: true,
      consider_current_load: true,
      zone_restriction: false
    }
  ): Promise<DriverAvailability[]> {
    const query = `
      SELECT d.*, 
        COALESCE(current_deliveries.delivery_count, 0) as current_load,
        (6371 * acos(cos(radians($1)) * cos(radians(current_latitude)) * 
         cos(radians(current_longitude) - radians($2)) + 
         sin(radians($1)) * sin(radians(current_latitude)))) as distance
      FROM drivers d
      LEFT JOIN (
        SELECT driver_id, COUNT(*) as delivery_count
        FROM deliveries 
        WHERE status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT') 
        GROUP BY driver_id
      ) current_deliveries ON d.id = current_deliveries.driver_id
      WHERE d.status = 'AVAILABLE'
        AND d.current_latitude IS NOT NULL 
        AND d.current_longitude IS NOT NULL
        AND (6371 * acos(cos(radians($1)) * cos(radians(d.current_latitude)) * 
             cos(radians(d.current_longitude) - radians($2)) + 
             sin(radians($1)) * sin(radians(d.current_latitude)))) <= $3
      ORDER BY distance ASC, rating DESC
      LIMIT 20
    `;

    const result = await this.db.query(query, [pickupLat, pickupLng, criteria.max_distance]);

    return result.rows.map(row => ({
      driver_id: row.id,
      driver_name: row.full_name,
      current_latitude: row.current_latitude,
      current_longitude: row.current_longitude,
      distance_to_pickup: parseFloat(row.distance),
      estimated_arrival_time: this.calculateEstimatedArrival(parseFloat(row.distance), row.vehicle_type),
      current_load: parseInt(row.current_load),
      rating: parseFloat(row.rating),
      vehicle_type: row.vehicle_type,
      zone_match: true, // TODO: Implement zone matching logic
      is_preferred: parseFloat(row.rating) >= 4.5 && parseInt(row.current_load) <= 2,
      commission_rate: parseFloat(row.commission_rate)
    }));
  }

  // ============= DELIVERY MANAGEMENT =============

  async createDelivery(deliveryData: CreateDeliveryRequest): Promise<Delivery> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Calculate estimated times and distance
      const { distance, duration } = await this.calculateRoute(
        deliveryData.pickup_latitude,
        deliveryData.pickup_longitude,
        deliveryData.delivery_latitude,
        deliveryData.delivery_longitude
      );

      const estimatedPickupTime = deliveryData.estimated_pickup_time || 
        new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

      const estimatedDeliveryTime = deliveryData.estimated_delivery_time ||
        new Date(estimatedPickupTime.getTime() + duration * 60 * 1000);

      const query = `
        INSERT INTO deliveries (
          order_id, customer_id, restaurant_id, partner_id,
          status, priority,
          pickup_address, pickup_latitude, pickup_longitude, 
          pickup_contact_name, pickup_contact_phone, pickup_instructions,
          delivery_address, delivery_latitude, delivery_longitude,
          delivery_contact_name, delivery_contact_phone, delivery_instructions,
          estimated_pickup_time, estimated_delivery_time,
          delivery_window_start, delivery_window_end,
          delivery_fee, payment_method, cash_to_collect,
          estimated_distance, estimated_duration,
          items_count, total_weight, special_instructions,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
        ) RETURNING *
      `;

      const values = [
        deliveryData.order_id,
        deliveryData.customer_id,
        deliveryData.restaurant_id,
        deliveryData.partner_id,
        DeliveryStatus.PENDING,
        deliveryData.priority || DeliveryPriority.NORMAL,
        deliveryData.pickup_address,
        deliveryData.pickup_latitude,
        deliveryData.pickup_longitude,
        deliveryData.pickup_contact_name,
        deliveryData.pickup_contact_phone,
        deliveryData.pickup_instructions,
        deliveryData.delivery_address,
        deliveryData.delivery_latitude,
        deliveryData.delivery_longitude,
        deliveryData.delivery_contact_name,
        deliveryData.delivery_contact_phone,
        deliveryData.delivery_instructions,
        estimatedPickupTime,
        estimatedDeliveryTime,
        deliveryData.delivery_window_start,
        deliveryData.delivery_window_end,
        deliveryData.delivery_fee,
        deliveryData.payment_method,
        deliveryData.cash_to_collect,
        distance,
        duration,
        deliveryData.items_count,
        deliveryData.total_weight,
        deliveryData.special_instructions,
        new Date(),
        new Date()
      ];

      const result = await client.query(query, values);
      const delivery = this.mapDeliveryFromDB(result.rows[0]);

      // Create initial tracking event
      await this.createTrackingEvent({
        delivery_id: delivery.id,
        event_type: TrackingEventType.ORDER_PLACED,
        description: 'Delivery order created',
        notes: 'Order placed and ready for driver assignment'
      });

      await client.query('COMMIT');

      // Try to auto-assign driver if priority is HIGH or URGENT
      if (delivery.priority === DeliveryPriority.HIGH || delivery.priority === DeliveryPriority.URGENT) {
        setTimeout(() => {
          this.autoAssignDriver(delivery.id).catch(console.error);
        }, 1000);
      }

      return delivery;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getDeliveryById(deliveryId: string): Promise<Delivery | null> {
    const query = 'SELECT * FROM deliveries WHERE id = $1';
    const result = await this.db.query(query, [deliveryId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDeliveryFromDB(result.rows[0]);
  }

  async updateDelivery(deliveryId: string, updateData: UpdateDeliveryRequest): Promise<Delivery> {
    const delivery = await this.getDeliveryById(deliveryId);
    if (!delivery) {
      throw new Error('Delivery not found');
    }

    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`);
          updateValues.push(value);
          paramIndex++;
        }
      });

      updateFields.push(`updated_at = $${paramIndex}`);
      updateValues.push(new Date());
      updateValues.push(deliveryId);

      const query = `
        UPDATE deliveries 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex + 1}
        RETURNING *
      `;

      const result = await client.query(query, updateValues);
      const updatedDelivery = this.mapDeliveryFromDB(result.rows[0]);

      // Create tracking event for status changes
      if (updateData.status && updateData.status !== delivery.status) {
        await this.createTrackingEvent({
          delivery_id: deliveryId,
          event_type: this.getTrackingEventTypeFromStatus(updateData.status),
          description: `Delivery status changed to ${updateData.status}`,
          notes: updateData.failure_reason || updateData.return_reason
        });

        // Emit real-time status update
        this.emitDeliveryStatusUpdate({
          delivery_id: deliveryId,
          status: updateData.status,
          driver_id: updatedDelivery.driver_id,
          timestamp: new Date(),
          message: `Delivery status updated to ${updateData.status}`
        });
      }

      await client.query('COMMIT');
      return updatedDelivery;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getDeliveries(filters: DeliveryFilters = {}): Promise<{ deliveries: Delivery[], total: number }> {
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (filters.status) {
      whereClause += ` AND status = $${paramIndex}`;
      queryParams.push(filters.status);
      paramIndex++;
    }

    if (filters.driver_id) {
      whereClause += ` AND driver_id = $${paramIndex}`;
      queryParams.push(filters.driver_id);
      paramIndex++;
    }

    if (filters.customer_id) {
      whereClause += ` AND customer_id = $${paramIndex}`;
      queryParams.push(filters.customer_id);
      paramIndex++;
    }

    if (filters.restaurant_id) {
      whereClause += ` AND restaurant_id = $${paramIndex}`;
      queryParams.push(filters.restaurant_id);
      paramIndex++;
    }

    if (filters.partner_id) {
      whereClause += ` AND partner_id = $${paramIndex}`;
      queryParams.push(filters.partner_id);
      paramIndex++;
    }

    if (filters.priority) {
      whereClause += ` AND priority = $${paramIndex}`;
      queryParams.push(filters.priority);
      paramIndex++;
    }

    if (filters.payment_method) {
      whereClause += ` AND payment_method = $${paramIndex}`;
      queryParams.push(filters.payment_method);
      paramIndex++;
    }

    if (filters.date_from) {
      whereClause += ` AND created_at >= $${paramIndex}`;
      queryParams.push(filters.date_from);
      paramIndex++;
    }

    if (filters.date_to) {
      whereClause += ` AND created_at <= $${paramIndex}`;
      queryParams.push(filters.date_to);
      paramIndex++;
    }

    if (filters.search) {
      whereClause += ` AND (order_id ILIKE $${paramIndex} OR delivery_contact_name ILIKE $${paramIndex} OR delivery_contact_phone ILIKE $${paramIndex})`;
      queryParams.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Count query
    const countQuery = `SELECT COUNT(*) FROM deliveries ${whereClause}`;
    const countResult = await this.db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Main query with pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const query = `
      SELECT * FROM deliveries 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const result = await this.db.query(query, queryParams);

    const deliveries = result.rows.map(row => this.mapDeliveryFromDB(row));

    return { deliveries, total };
  }

  // ============= DRIVER ASSIGNMENT =============

  async assignDriverToDelivery(deliveryId: string, driverId: string): Promise<DeliveryAssignment> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Verify delivery exists and is assignable
      const delivery = await this.getDeliveryById(deliveryId);
      if (!delivery) {
        throw new Error('Delivery not found');
      }

      if (delivery.status !== DeliveryStatus.PENDING) {
        throw new Error('Delivery is not available for assignment');
      }

      // Verify driver exists and is available
      const driver = await this.getDriverById(driverId);
      if (!driver) {
        throw new Error('Driver not found');
      }

      if (driver.status !== DriverStatus.AVAILABLE) {
        throw new Error('Driver is not available');
      }

      // Calculate commission and timing
      const driverCommission = delivery.delivery_fee * driver.commission_rate;
      const estimatedPickupTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      const estimatedDeliveryTime = new Date(estimatedPickupTime.getTime() + delivery.estimated_duration * 60 * 1000);

      // Create assignment record
      const assignmentQuery = `
        INSERT INTO delivery_assignments (
          delivery_id, driver_id, assigned_at, expires_at,
          estimated_pickup_time, estimated_delivery_time, offered_commission,
          is_accepted, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const assignmentValues = [
        deliveryId,
        driverId,
        new Date(),
        new Date(Date.now() + 5 * 60 * 1000), // 5 minutes to accept
        estimatedPickupTime,
        estimatedDeliveryTime,
        driverCommission,
        false,
        new Date(),
        new Date()
      ];

      const assignmentResult = await client.query(assignmentQuery, assignmentValues);

      // Update delivery
      await client.query(
        'UPDATE deliveries SET driver_id = $1, status = $2, driver_commission = $3, updated_at = $4 WHERE id = $5',
        [driverId, DeliveryStatus.ASSIGNED, driverCommission, new Date(), deliveryId]
      );

      // Update driver status
      await client.query(
        'UPDATE drivers SET status = $1, updated_at = $2 WHERE id = $3',
        [DriverStatus.BUSY, new Date(), driverId]
      );

      // Create tracking event
      await this.createTrackingEvent({
        delivery_id: deliveryId,
        event_type: TrackingEventType.DRIVER_ASSIGNED,
        description: `Driver ${driver.full_name} assigned to delivery`,
        notes: `Driver commission: $${driverCommission.toFixed(2)}`
      });

      await client.query('COMMIT');

      const assignment = this.mapAssignmentFromDB(assignmentResult.rows[0]);

      // Send real-time notification to driver
      // TODO: Implement push notification service

      return assignment;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async autoAssignDriver(deliveryId: string): Promise<AssignmentResult> {
    const delivery = await this.getDeliveryById(deliveryId);
    if (!delivery) {
      throw new Error('Delivery not found');
    }

    // Get available drivers near pickup location
    const availableDrivers = await this.getAvailableDrivers(
      delivery.pickup_latitude,
      delivery.pickup_longitude
    );

    if (availableDrivers.length === 0) {
      return {
        delivery_id: deliveryId,
        recommended_drivers: [],
        assignment_score: 0,
        estimated_pickup_time: new Date(),
        estimated_delivery_time: new Date(),
        reason: 'No available drivers found'
      };
    }

    // Score and rank drivers
    const scoredDrivers = availableDrivers.map(driver => ({
      ...driver,
      score: this.calculateDriverScore(driver, delivery)
    })).sort((a, b) => b.score - a.score);

    // Try to assign to the best driver
    const bestDriver = scoredDrivers[0];
    
    try {
      await this.assignDriverToDelivery(deliveryId, bestDriver.driver_id);
      
      return {
        delivery_id: deliveryId,
        recommended_drivers: scoredDrivers,
        assignment_score: bestDriver.score,
        estimated_pickup_time: new Date(Date.now() + bestDriver.estimated_arrival_time * 60 * 1000),
        estimated_delivery_time: new Date(Date.now() + (bestDriver.estimated_arrival_time + delivery.estimated_duration) * 60 * 1000),
        reason: `Successfully assigned to ${bestDriver.driver_name}`
      };
    } catch (error) {
      return {
        delivery_id: deliveryId,
        recommended_drivers: scoredDrivers,
        assignment_score: 0,
        estimated_pickup_time: new Date(),
        estimated_delivery_time: new Date(),
        reason: `Assignment failed: ${error}`
      };
    }
  }

  // ============= TRACKING & EVENTS =============

  async createTrackingEvent(eventData: CreateTrackingEventRequest): Promise<TrackingEvent> {
    const query = `
      INSERT INTO tracking_events (
        delivery_id, driver_id, event_type, timestamp,
        latitude, longitude, address, description, notes, photo_url,
        created_by, source, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      eventData.delivery_id,
      null, // driver_id - to be filled by middleware
      eventData.event_type,
      new Date(),
      eventData.latitude,
      eventData.longitude,
      eventData.address,
      eventData.description,
      eventData.notes,
      eventData.photo_url,
      'system',
      'api',
      new Date()
    ];

    const result = await this.db.query(query, values);
    return this.mapTrackingEventFromDB(result.rows[0]);
  }

  async getTrackingEvents(deliveryId: string): Promise<TrackingEvent[]> {
    const query = `
      SELECT * FROM tracking_events 
      WHERE delivery_id = $1 
      ORDER BY timestamp ASC
    `;

    const result = await this.db.query(query, [deliveryId]);
    return result.rows.map(row => this.mapTrackingEventFromDB(row));
  }

  async updateDeliveryProof(deliveryId: string, proofData: DeliveryProofRequest): Promise<void> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Update delivery with proof
      const query = `
        UPDATE deliveries 
        SET delivery_photo_url = $1, delivery_signature = $2, delivery_notes = $3,
            status = $4, actual_delivery_time = $5, updated_at = $6
        WHERE id = $7
      `;

      await client.query(query, [
        proofData.delivery_photo_url,
        proofData.delivery_signature,
        proofData.delivery_notes,
        DeliveryStatus.DELIVERED,
        new Date(),
        new Date(),
        deliveryId
      ]);

      // Create tracking event
      await this.createTrackingEvent({
        delivery_id: deliveryId,
        event_type: TrackingEventType.DELIVERED,
        description: 'Delivery completed with proof',
        notes: `Delivered to: ${proofData.delivered_to || 'Customer'}, Customer present: ${proofData.customer_present}`
      });

      // Update driver status
      const delivery = await this.getDeliveryById(deliveryId);
      if (delivery?.driver_id) {
        await this.updateDriverStatus(delivery.driver_id, DriverStatus.AVAILABLE);
        
        // Update driver statistics
        await this.updateDriverStats(delivery.driver_id, delivery);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ============= ANALYTICS & REPORTING =============

  async getDeliveryAnalytics(dateFrom?: Date, dateTo?: Date): Promise<DeliveryAnalytics> {
    const fromDate = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const toDate = dateTo || new Date();

    const queries = {
      totalDeliveries: `
        SELECT COUNT(*) as total FROM deliveries 
        WHERE created_at BETWEEN $1 AND $2
      `,
      completedDeliveries: `
        SELECT COUNT(*) as completed FROM deliveries 
        WHERE created_at BETWEEN $1 AND $2 AND status = 'DELIVERED'
      `,
      averageDeliveryTime: `
        SELECT AVG(EXTRACT(EPOCH FROM (actual_delivery_time - created_at))/60) as avg_time
        FROM deliveries 
        WHERE created_at BETWEEN $1 AND $2 AND actual_delivery_time IS NOT NULL
      `,
      totalDistance: `
        SELECT SUM(actual_distance) as total_distance FROM deliveries 
        WHERE created_at BETWEEN $1 AND $2 AND actual_distance IS NOT NULL
      `,
      totalRevenue: `
        SELECT SUM(delivery_fee) as total_revenue FROM deliveries 
        WHERE created_at BETWEEN $1 AND $2 AND status = 'DELIVERED'
      `,
      deliveriesByStatus: `
        SELECT status, COUNT(*) as count FROM deliveries 
        WHERE created_at BETWEEN $1 AND $2 
        GROUP BY status
      `,
      peakHours: `
        SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as delivery_count
        FROM deliveries 
        WHERE created_at BETWEEN $1 AND $2 
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour
      `,
      topDrivers: `
        SELECT d.driver_id, dr.full_name as driver_name,
               COUNT(*) as deliveries_count,
               AVG(CASE WHEN d.status = 'DELIVERED' THEN 1.0 ELSE 0.0 END) as success_rate,
               AVG(EXTRACT(EPOCH FROM (d.actual_delivery_time - d.created_at))/60) as average_time,
               dr.rating
        FROM deliveries d
        JOIN drivers dr ON d.driver_id = dr.id
        WHERE d.created_at BETWEEN $1 AND $2 AND d.driver_id IS NOT NULL
        GROUP BY d.driver_id, dr.full_name, dr.rating
        ORDER BY deliveries_count DESC, success_rate DESC
        LIMIT 10
      `
    };

    const results = await Promise.all([
      this.db.query(queries.totalDeliveries, [fromDate, toDate]),
      this.db.query(queries.completedDeliveries, [fromDate, toDate]),
      this.db.query(queries.averageDeliveryTime, [fromDate, toDate]),
      this.db.query(queries.totalDistance, [fromDate, toDate]),
      this.db.query(queries.totalRevenue, [fromDate, toDate]),
      this.db.query(queries.deliveriesByStatus, [fromDate, toDate]),
      this.db.query(queries.peakHours, [fromDate, toDate]),
      this.db.query(queries.topDrivers, [fromDate, toDate])
    ]);

    const totalDeliveries = parseInt(results[0].rows[0].total);
    const completedDeliveries = parseInt(results[1].rows[0].completed);

    return {
      total_deliveries: totalDeliveries,
      completed_deliveries: completedDeliveries,
      success_rate: totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0,
      average_delivery_time: parseFloat(results[2].rows[0].avg_time) || 0,
      total_distance: parseFloat(results[3].rows[0].total_distance) || 0,
      total_revenue: parseFloat(results[4].rows[0].total_revenue) || 0,
      deliveries_by_status: results[5].rows.reduce((acc, row) => {
        acc[row.status as DeliveryStatus] = parseInt(row.count);
        return acc;
      }, {} as Record<DeliveryStatus, number>),
      deliveries_by_zone: {}, // TODO: Implement zone analytics
      peak_hours: results[6].rows.map(row => ({
        hour: parseInt(row.hour),
        delivery_count: parseInt(row.delivery_count)
      })),
      top_performing_drivers: results[7].rows.map(row => ({
        driver_id: row.driver_id,
        driver_name: row.driver_name,
        deliveries_count: parseInt(row.deliveries_count),
        success_rate: parseFloat(row.success_rate) * 100,
        average_time: parseFloat(row.average_time),
        rating: parseFloat(row.rating)
      }))
    };
  }

  async getDriverAnalytics(): Promise<DriverAnalytics> {
    const queries = {
      totalDrivers: 'SELECT COUNT(*) as total FROM drivers',
      activeDrivers: 'SELECT COUNT(*) as active FROM drivers WHERE status IN (\'AVAILABLE\', \'BUSY\', \'ON_DELIVERY\')',
      driversOnDelivery: 'SELECT COUNT(*) as on_delivery FROM drivers WHERE status = \'ON_DELIVERY\'',
      averageRating: 'SELECT AVG(rating) as avg_rating FROM drivers',
      totalEarnings: 'SELECT SUM(earnings_today) as total_earnings FROM drivers',
      driversByStatus: 'SELECT status, COUNT(*) as count FROM drivers GROUP BY status',
      driversByVehicle: 'SELECT vehicle_type, COUNT(*) as count FROM drivers GROUP BY vehicle_type',
      driverPerformance: `
        SELECT id as driver_id, full_name as driver_name, 
               earnings_today, rating,
               COALESCE(EXTRACT(EPOCH FROM (NOW() - online_since))/3600, 0) as online_hours,
               COALESCE(todays_deliveries.count, 0) as deliveries_today
        FROM drivers d
        LEFT JOIN (
          SELECT driver_id, COUNT(*) as count
          FROM deliveries 
          WHERE DATE(created_at) = CURRENT_DATE AND driver_id IS NOT NULL
          GROUP BY driver_id
        ) todays_deliveries ON d.id = todays_deliveries.driver_id
        WHERE d.status != 'SUSPENDED'
        ORDER BY earnings_today DESC, rating DESC
        LIMIT 20
      `
    };

    const results = await Promise.all([
      this.db.query(queries.totalDrivers),
      this.db.query(queries.activeDrivers),
      this.db.query(queries.driversOnDelivery),
      this.db.query(queries.averageRating),
      this.db.query(queries.totalEarnings),
      this.db.query(queries.driversByStatus),
      this.db.query(queries.driversByVehicle),
      this.db.query(queries.driverPerformance)
    ]);

    return {
      total_drivers: parseInt(results[0].rows[0].total),
      active_drivers: parseInt(results[1].rows[0].active),
      drivers_on_delivery: parseInt(results[2].rows[0].on_delivery),
      average_rating: parseFloat(results[3].rows[0].avg_rating) || 0,
      total_earnings: parseFloat(results[4].rows[0].total_earnings) || 0,
      drivers_by_status: results[5].rows.reduce((acc, row) => {
        acc[row.status as DriverStatus] = parseInt(row.count);
        return acc;
      }, {} as Record<DriverStatus, number>),
      drivers_by_vehicle: results[6].rows.reduce((acc, row) => {
        acc[row.vehicle_type as VehicleType] = parseInt(row.count);
        return acc;
      }, {} as Record<VehicleType, number>),
      driver_performance: results[7].rows.map(row => ({
        driver_id: row.driver_id,
        driver_name: row.driver_name,
        deliveries_today: parseInt(row.deliveries_today),
        earnings_today: parseFloat(row.earnings_today),
        rating: parseFloat(row.rating),
        online_hours: parseFloat(row.online_hours)
      }))
    };
  }

  // ============= HELPER METHODS =============

  private async generateDriverCode(): Promise<string> {
    const prefix = 'DRV';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }

  private calculateEstimatedArrival(distance: number, vehicleType: VehicleType): number {
    const speeds = {
      [VehicleType.WALKING]: 5,
      [VehicleType.BICYCLE]: 15,
      [VehicleType.MOTORBIKE]: 30,
      [VehicleType.CAR]: 25,
      [VehicleType.TRUCK]: 20
    };

    const speed = speeds[vehicleType] || 25;
    return Math.ceil((distance / speed) * 60); // Convert to minutes
  }

  private async calculateRoute(fromLat: number, fromLng: number, toLat: number, toLng: number): Promise<{ distance: number, duration: number }> {
    // Simple distance calculation using Haversine formula
    const R = 6371; // Earth's radius in kilometers
    const dLat = (toLat - fromLat) * Math.PI / 180;
    const dLon = (toLng - fromLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(fromLat * Math.PI / 180) * Math.cos(toLat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Estimate duration (assuming average speed in city traffic)
    const duration = (distance / 25) * 60; // 25 km/h average speed, result in minutes

    return { distance, duration };
  }

  private calculateDriverScore(driver: DriverAvailability, delivery: Delivery): number {
    let score = 0;

    // Distance score (closer is better, max 40 points)
    const distanceScore = Math.max(0, 40 - (driver.distance_to_pickup * 4));
    score += distanceScore;

    // Rating score (max 30 points)
    const ratingScore = (driver.rating / 5) * 30;
    score += ratingScore;

    // Load score (less busy is better, max 20 points)
    const loadScore = Math.max(0, 20 - (driver.current_load * 5));
    score += loadScore;

    // Priority bonus
    if (delivery.priority === DeliveryPriority.URGENT) {
      score += 10;
    } else if (delivery.priority === DeliveryPriority.HIGH) {
      score += 5;
    }

    // Preferred driver bonus
    if (driver.is_preferred) {
      score += 10;
    }

    // Vehicle type matching bonus
    if (delivery.items_count > 5 && driver.vehicle_type === VehicleType.CAR) {
      score += 5;
    }

    return Math.round(score);
  }

  private getTrackingEventTypeFromStatus(status: DeliveryStatus): TrackingEventType {
    // Use a properly typed mapping to avoid TS7053 when indexing by DeliveryStatus.
    const mapping: Partial<Record<DeliveryStatus, TrackingEventType>> = {
      [DeliveryStatus.ASSIGNED]: TrackingEventType.DRIVER_ASSIGNED,
      [DeliveryStatus.PICKED_UP]: TrackingEventType.ORDER_PICKED_UP,
      [DeliveryStatus.IN_TRANSIT]: TrackingEventType.EN_ROUTE_TO_CUSTOMER,
      [DeliveryStatus.DELIVERED]: TrackingEventType.DELIVERED,
      [DeliveryStatus.FAILED]: TrackingEventType.DELIVERY_FAILED,
      [DeliveryStatus.CANCELLED]: TrackingEventType.CANCELLED,
      [DeliveryStatus.RETURNED]: TrackingEventType.RETURNED
    };

    return mapping[status] ?? TrackingEventType.ORDER_PLACED;
  }

  private async updateDriverStats(driverId: string, delivery: Delivery): Promise<void> {
    const deliveryTime = delivery.actual_delivery_time && delivery.created_at 
      ? (delivery.actual_delivery_time.getTime() - delivery.created_at.getTime()) / (1000 * 60)
      : 0;

    const query = `
      UPDATE drivers 
      SET total_deliveries = total_deliveries + 1,
          successful_deliveries = successful_deliveries + 1,
          average_delivery_time = ((average_delivery_time * total_deliveries) + $1) / (total_deliveries + 1),
          total_distance = total_distance + $2,
          earnings_today = earnings_today + $3,
          earnings_this_month = earnings_this_month + $4,
          updated_at = $5
      WHERE id = $6
    `;

    await this.db.query(query, [
      deliveryTime,
      delivery.actual_distance || 0,
      delivery.driver_commission || 0,
      delivery.driver_commission || 0,
      new Date(),
      driverId
    ]);
  }

  // Real-time event emitters (to be implemented with WebSocket)
  private emitLocationUpdate(update: LocationUpdate): void {
    // TODO: Implement WebSocket emission
    console.log('Location update:', update);
  }

  private emitDeliveryStatusUpdate(update: DeliveryStatusUpdate): void {
    // TODO: Implement WebSocket emission
    console.log('Delivery status update:', update);
  }

  private emitDriverStatusUpdate(update: DriverStatusUpdate): void {
    // TODO: Implement WebSocket emission
    console.log('Driver status update:', update);
  }

  // Database mapping methods
  private mapDriverFromDB(row: any): Driver {
    return {
      id: row.id,
      user_id: row.user_id,
      driver_code: row.driver_code,
      full_name: row.full_name,
      phone: row.phone,
      email: row.email,
      status: row.status,
      vehicle_type: row.vehicle_type,
      vehicle_plate: row.vehicle_plate,
      vehicle_model: row.vehicle_model,
      vehicle_color: row.vehicle_color,
      license_number: row.license_number,
      license_expiry: row.license_expiry,
      identity_number: row.identity_number,
      current_latitude: row.current_latitude,
      current_longitude: row.current_longitude,
      last_location_update: row.last_location_update,
      zone_coverage: JSON.parse(row.zone_coverage || '[]'),
      working_start_time: row.working_start_time,
      working_end_time: row.working_end_time,
      working_days: JSON.parse(row.working_days || '[]'),
      rating: parseFloat(row.rating),
      total_deliveries: parseInt(row.total_deliveries),
      successful_deliveries: parseInt(row.successful_deliveries),
      average_delivery_time: parseFloat(row.average_delivery_time),
      total_distance: parseFloat(row.total_distance),
      commission_rate: parseFloat(row.commission_rate),
      earnings_today: parseFloat(row.earnings_today),
      earnings_this_month: parseFloat(row.earnings_this_month),
      online_since: row.online_since,
      last_active: row.last_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
      metadata: row.metadata
    };
  }

  private mapDeliveryFromDB(row: any): Delivery {
    return {
      id: row.id,
      order_id: row.order_id,
      customer_id: row.customer_id,
      restaurant_id: row.restaurant_id,
      partner_id: row.partner_id,
      driver_id: row.driver_id,
      status: row.status,
      priority: row.priority,
      pickup_address: row.pickup_address,
      pickup_latitude: parseFloat(row.pickup_latitude),
      pickup_longitude: parseFloat(row.pickup_longitude),
      pickup_contact_name: row.pickup_contact_name,
      pickup_contact_phone: row.pickup_contact_phone,
      pickup_instructions: row.pickup_instructions,
      delivery_address: row.delivery_address,
      delivery_latitude: parseFloat(row.delivery_latitude),
      delivery_longitude: parseFloat(row.delivery_longitude),
      delivery_contact_name: row.delivery_contact_name,
      delivery_contact_phone: row.delivery_contact_phone,
      delivery_instructions: row.delivery_instructions,
      estimated_pickup_time: row.estimated_pickup_time,
      estimated_delivery_time: row.estimated_delivery_time,
      actual_pickup_time: row.actual_pickup_time,
      actual_delivery_time: row.actual_delivery_time,
      delivery_window_start: row.delivery_window_start,
      delivery_window_end: row.delivery_window_end,
      delivery_fee: parseFloat(row.delivery_fee),
      driver_commission: parseFloat(row.driver_commission || 0),
      payment_method: row.payment_method,
      cash_to_collect: parseFloat(row.cash_to_collect || 0),
      estimated_distance: parseFloat(row.estimated_distance),
      actual_distance: parseFloat(row.actual_distance || 0),
      estimated_duration: parseFloat(row.estimated_duration),
      actual_duration: parseFloat(row.actual_duration || 0),
      items_count: parseInt(row.items_count),
      total_weight: parseFloat(row.total_weight || 0),
      special_instructions: row.special_instructions,
      delivery_photo_url: row.delivery_photo_url,
      delivery_signature: row.delivery_signature,
      delivery_notes: row.delivery_notes,
      failure_reason: row.failure_reason,
      return_reason: row.return_reason,
      created_at: row.created_at,
      updated_at: row.updated_at,
      metadata: row.metadata
    };
  }

  private mapAssignmentFromDB(row: any): DeliveryAssignment {
    return {
      id: row.id,
      delivery_id: row.delivery_id,
      driver_id: row.driver_id,
      assigned_at: row.assigned_at,
      accepted_at: row.accepted_at,
      rejected_at: row.rejected_at,
      rejection_reason: row.rejection_reason,
      expires_at: row.expires_at,
      estimated_pickup_time: row.estimated_pickup_time,
      estimated_delivery_time: row.estimated_delivery_time,
      offered_commission: parseFloat(row.offered_commission),
      is_accepted: row.is_accepted,
      response_time: parseInt(row.response_time || 0),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  private mapTrackingEventFromDB(row: any): TrackingEvent {
    return {
      id: row.id,
      delivery_id: row.delivery_id,
      driver_id: row.driver_id,
      event_type: row.event_type,
      timestamp: row.timestamp,
      latitude: parseFloat(row.latitude || 0),
      longitude: parseFloat(row.longitude || 0),
      address: row.address,
      description: row.description,
      notes: row.notes,
      photo_url: row.photo_url,
      created_by: row.created_by,
      source: row.source,
      created_at: row.created_at,
      metadata: row.metadata
    };
  }
}