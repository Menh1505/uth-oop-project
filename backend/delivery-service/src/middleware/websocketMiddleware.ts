import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { authenticateWebSocket, JWTPayload } from './authMiddleware';
import {
  LocationUpdate,
  DeliveryStatusUpdate,
  DriverStatusUpdate,
  DeliveryNotification
} from '../models/Delivery';

interface AuthenticatedSocket extends Socket {
  user?: JWTPayload;
  rooms?: Set<string>;
}

interface SocketData {
  user: JWTPayload;
  lastSeen: Date;
  activeRooms: string[];
}

export class WebSocketManager {
  private io: SocketIOServer;
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();
  private driverLocations: Map<string, LocationUpdate> = new Map();
  private deliverySubscriptions: Map<string, Set<string>> = new Map(); // delivery_id -> user_ids

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const user = authenticateWebSocket(token);
      if (!user) {
        return next(new Error('Invalid authentication token'));
      }

      socket.user = user;
      next();
    });

    // Rate limiting middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      // Basic rate limiting for WebSocket connections
      const userId = socket.user?.id;
      if (userId) {
        // Implement rate limiting logic here
        console.log(`WebSocket connection from user: ${userId}`);
      }
      next();
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User connected: ${socket.user?.id} (${socket.user?.role})`);
      
      // Store connection
      if (socket.user?.id) {
        this.connectedUsers.set(socket.user.id, socket);
      }

      // Join user-specific room
      if (socket.user?.id) {
        socket.join(`user:${socket.user.id}`);
      }

      // Join role-specific room
      if (socket.user?.role) {
        socket.join(`role:${socket.user.role}`);
      }

      // Handle driver-specific events
      if (socket.user?.role === 'driver') {
        this.handleDriverEvents(socket);
      }

      // Handle customer-specific events
      if (socket.user?.role === 'customer') {
        this.handleCustomerEvents(socket);
      }

      // Handle admin-specific events
      if (socket.user?.role === 'admin') {
        this.handleAdminEvents(socket);
      }

      // Handle partner-specific events
      if (socket.user?.role === 'partner') {
        this.handlePartnerEvents(socket);
      }

      // Common events for all users
      this.handleCommonEvents(socket);

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`User disconnected: ${socket.user?.id}, reason: ${reason}`);
        
        if (socket.user?.id) {
          this.connectedUsers.delete(socket.user.id);
          
          // Remove from delivery subscriptions
          this.deliverySubscriptions.forEach((subscribers, deliveryId) => {
            subscribers.delete(socket.user!.id);
            if (subscribers.size === 0) {
              this.deliverySubscriptions.delete(deliveryId);
            }
          });

          // Remove driver location if driver disconnects
          if (socket.user.role === 'driver' && socket.user.driver_id) {
            this.driverLocations.delete(socket.user.driver_id);
          }
        }
      });
    });
  }

  private handleDriverEvents(socket: AuthenticatedSocket): void {
    const driverId = socket.user?.driver_id;
    if (!driverId) return;

    // Join driver-specific room
    socket.join(`driver:${driverId}`);

    // Handle location updates
    socket.on('location:update', (data: LocationUpdate) => {
      if (this.validateLocationUpdate(data)) {
        data.driver_id = driverId;
        data.timestamp = new Date();
        
        // Store location
        this.driverLocations.set(driverId, data);
        
        // Broadcast to relevant parties
        this.broadcastLocationUpdate(data);
        
        socket.emit('location:update:ack', { 
          success: true, 
          timestamp: data.timestamp 
        });
      } else {
        socket.emit('location:update:error', {
          success: false,
          message: 'Invalid location data'
        });
      }
    });

    // Handle delivery status updates
    socket.on('delivery:status:update', (data: {
      delivery_id: string;
      status: string;
      location?: { latitude: number; longitude: number };
      message?: string;
    }) => {
      const statusUpdate: DeliveryStatusUpdate = {
        delivery_id: data.delivery_id,
        status: data.status as any,
        driver_id: driverId,
        location: data.location,
        timestamp: new Date(),
        message: data.message
      };

      this.broadcastDeliveryStatusUpdate(statusUpdate);
      
      socket.emit('delivery:status:update:ack', {
        success: true,
        delivery_id: data.delivery_id,
        timestamp: statusUpdate.timestamp
      });
    });

    // Handle driver status updates
    socket.on('driver:status:update', (data: {
      status: string;
      location?: { latitude: number; longitude: number };
    }) => {
      const statusUpdate: DriverStatusUpdate = {
        driver_id: driverId,
        status: data.status as any,
        location: data.location,
        timestamp: new Date()
      };

      this.broadcastDriverStatusUpdate(statusUpdate);
      
      socket.emit('driver:status:update:ack', {
        success: true,
        timestamp: statusUpdate.timestamp
      });
    });

    // Get driver's current deliveries
    socket.on('driver:deliveries:get', () => {
      // This would typically fetch from database
      socket.emit('driver:deliveries:list', {
        deliveries: [], // TODO: Implement delivery fetching
        timestamp: new Date()
      });
    });
  }

  private handleCustomerEvents(socket: AuthenticatedSocket): void {
    const customerId = socket.user?.id;
    if (!customerId) return;

    // Subscribe to delivery updates
    socket.on('delivery:subscribe', (data: { delivery_id: string }) => {
      const { delivery_id } = data;
      
      // Add user to delivery subscriptions
      if (!this.deliverySubscriptions.has(delivery_id)) {
        this.deliverySubscriptions.set(delivery_id, new Set());
      }
      this.deliverySubscriptions.get(delivery_id)!.add(customerId);
      
      // Join delivery-specific room
      socket.join(`delivery:${delivery_id}`);
      
      socket.emit('delivery:subscribe:ack', {
        success: true,
        delivery_id,
        message: 'Subscribed to delivery updates'
      });
    });

    // Unsubscribe from delivery updates
    socket.on('delivery:unsubscribe', (data: { delivery_id: string }) => {
      const { delivery_id } = data;
      
      // Remove user from delivery subscriptions
      if (this.deliverySubscriptions.has(delivery_id)) {
        this.deliverySubscriptions.get(delivery_id)!.delete(customerId);
        if (this.deliverySubscriptions.get(delivery_id)!.size === 0) {
          this.deliverySubscriptions.delete(delivery_id);
        }
      }
      
      // Leave delivery-specific room
      socket.leave(`delivery:${delivery_id}`);
      
      socket.emit('delivery:unsubscribe:ack', {
        success: true,
        delivery_id,
        message: 'Unsubscribed from delivery updates'
      });
    });

    // Get live tracking data
    socket.on('delivery:tracking:get', (data: { delivery_id: string }) => {
      const { delivery_id } = data;
      
      // Get driver location if available
      // This would typically involve looking up the delivery and finding the driver
      socket.emit('delivery:tracking:data', {
        delivery_id,
        driver_location: null, // TODO: Implement location fetching
        last_update: new Date(),
        estimated_arrival: null
      });
    });
  }

  private handleAdminEvents(socket: AuthenticatedSocket): void {
    // Join admin room for broadcasting
    socket.join('admins');

    // Get all active drivers
    socket.on('admin:drivers:get', () => {
      const activeDrivers = Array.from(this.driverLocations.entries()).map(([driverId, location]) => ({
        driver_id: driverId,
        location,
        last_update: location.timestamp
      }));

      socket.emit('admin:drivers:list', {
        drivers: activeDrivers,
        timestamp: new Date()
      });
    });

    // Get real-time statistics
    socket.on('admin:stats:get', () => {
      const stats = {
        connected_drivers: this.driverLocations.size,
        active_deliveries: this.deliverySubscriptions.size,
        connected_users: this.connectedUsers.size,
        timestamp: new Date()
      };

      socket.emit('admin:stats:data', stats);
    });

    // Broadcast message to all users
    socket.on('admin:broadcast', (data: {
      message: string;
      type: 'info' | 'warning' | 'emergency';
      targets?: string[]; // roles to target
    }) => {
      const notification: DeliveryNotification = {
        type: 'STATUS_UPDATE' as any,
        delivery_id: '',
        recipient_id: '',
        recipient_type: 'ADMIN' as any,
        title: 'System Announcement',
        message: data.message,
        timestamp: new Date()
      };

      if (data.targets && data.targets.length > 0) {
        // Broadcast to specific roles
        data.targets.forEach(role => {
          this.io.to(`role:${role}`).emit('notification', notification);
        });
      } else {
        // Broadcast to all connected users
        this.io.emit('notification', notification);
      }
    });
  }

  private handlePartnerEvents(socket: AuthenticatedSocket): void {
    const partnerId = socket.user?.id;
    if (!partnerId) return;

    // Join partner-specific room
    socket.join(`partner:${partnerId}`);

    // Get partner's delivery statistics
    socket.on('partner:stats:get', () => {
      // This would typically fetch from database
      socket.emit('partner:stats:data', {
        active_deliveries: 0,
        completed_today: 0,
        average_delivery_time: 0,
        timestamp: new Date()
      });
    });
  }

  private handleCommonEvents(socket: AuthenticatedSocket): void {
    // Ping/Pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });

    // Get user's notification preferences
    socket.on('notifications:preferences:get', () => {
      socket.emit('notifications:preferences:data', {
        push_enabled: true,
        email_enabled: true,
        sms_enabled: false
      });
    });

    // Update notification preferences
    socket.on('notifications:preferences:update', (data: {
      push_enabled?: boolean;
      email_enabled?: boolean;
      sms_enabled?: boolean;
    }) => {
      // TODO: Update preferences in database
      socket.emit('notifications:preferences:update:ack', {
        success: true,
        preferences: data
      });
    });
  }

  // Public methods for broadcasting from other parts of the application
  public broadcastLocationUpdate(update: LocationUpdate): void {
    // Broadcast to admins
    this.io.to('admins').emit('location:update', update);
    
    // Broadcast to customers tracking deliveries involving this driver
    if (update.delivery_id) {
      this.io.to(`delivery:${update.delivery_id}`).emit('location:update', update);
    }
  }

  public broadcastDeliveryStatusUpdate(update: DeliveryStatusUpdate): void {
    // Broadcast to specific delivery subscribers
    this.io.to(`delivery:${update.delivery_id}`).emit('delivery:status:update', update);
    
    // Broadcast to admins
    this.io.to('admins').emit('delivery:status:update', update);
    
    // Broadcast to driver
    if (update.driver_id) {
      this.io.to(`driver:${update.driver_id}`).emit('delivery:status:update', update);
    }
  }

  public broadcastDriverStatusUpdate(update: DriverStatusUpdate): void {
    // Broadcast to admins
    this.io.to('admins').emit('driver:status:update', update);
    
    // Broadcast to partners if driver status affects their orders
    this.io.to('role:partner').emit('driver:status:update', update);
  }

  public sendNotification(notification: DeliveryNotification): void {
    // Send to specific user
    this.io.to(`user:${notification.recipient_id}`).emit('notification', notification);
    
    // Also send to admins for monitoring
    this.io.to('admins').emit('notification', notification);
  }

  public broadcastToRole(role: string, event: string, data: any): void {
    this.io.to(`role:${role}`).emit(event, data);
  }

  public sendToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public getDriverLocations(): Map<string, LocationUpdate> {
    return new Map(this.driverLocations);
  }

  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  private validateLocationUpdate(data: LocationUpdate): boolean {
    return (
      typeof data.latitude === 'number' &&
      typeof data.longitude === 'number' &&
      data.latitude >= -90 &&
      data.latitude <= 90 &&
      data.longitude >= -180 &&
      data.longitude <= 180
    );
  }

  // Cleanup method for graceful shutdown
  public close(): void {
    this.io.close();
    this.connectedUsers.clear();
    this.driverLocations.clear();
    this.deliverySubscriptions.clear();
  }

  // Get Socket.IO instance for external use
  public getIO(): SocketIOServer {
    return this.io;
  }
}