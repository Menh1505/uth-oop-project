// ============= ENUMS =============

export enum DeliveryStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED'
}

export enum DriverStatus {
  OFFLINE = 'OFFLINE',
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  ON_DELIVERY = 'ON_DELIVERY',
  BREAK = 'BREAK',
  SUSPENDED = 'SUSPENDED'
}

export enum VehicleType {
  MOTORBIKE = 'MOTORBIKE',
  BICYCLE = 'BICYCLE',
  CAR = 'CAR',
  TRUCK = 'TRUCK',
  WALKING = 'WALKING'
}

export enum DeliveryPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TrackingEventType {
  ORDER_PLACED = 'ORDER_PLACED',
  DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
  DRIVER_EN_ROUTE = 'DRIVER_EN_ROUTE',
  ARRIVED_AT_RESTAURANT = 'ARRIVED_AT_RESTAURANT',
  ORDER_PICKED_UP = 'ORDER_PICKED_UP',
  EN_ROUTE_TO_CUSTOMER = 'EN_ROUTE_TO_CUSTOMER',
  ARRIVED_AT_DESTINATION = 'ARRIVED_AT_DESTINATION',
  DELIVERED = 'DELIVERED',
  DELIVERY_FAILED = 'DELIVERY_FAILED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  PREPAID = 'PREPAID'
}

// ============= INTERFACES =============

export interface Driver {
  id: string;
  user_id: string;
  driver_code: string;
  full_name: string;
  phone: string;
  email: string;
  status: DriverStatus;
  
  // Vehicle information
  vehicle_type: VehicleType;
  vehicle_plate: string;
  vehicle_model?: string;
  vehicle_color?: string;
  
  // License and documents
  license_number: string;
  license_expiry: Date;
  identity_number: string;
  
  // Location tracking
  current_latitude?: number;
  current_longitude?: number;
  last_location_update?: Date;
  
  // Work information
  zone_coverage: string[]; // Areas driver can cover
  working_start_time: string;
  working_end_time: string;
  working_days: string[];
  
  // Performance metrics
  rating: number;
  total_deliveries: number;
  successful_deliveries: number;
  average_delivery_time: number; // in minutes
  total_distance: number; // in kilometers
  
  // Financial
  commission_rate: number;
  earnings_today: number;
  earnings_this_month: number;
  
  // Status tracking
  online_since?: Date;
  last_active: Date;
  
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, any>;
}

export interface Delivery {
  id: string;
  order_id: string;
  customer_id: string;
  restaurant_id: string;
  partner_id: string;
  driver_id?: string;
  
  // Status and priority
  status: DeliveryStatus;
  priority: DeliveryPriority;
  
  // Pickup information
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_contact_name: string;
  pickup_contact_phone: string;
  pickup_instructions?: string;
  
  // Delivery information
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  delivery_contact_name: string;
  delivery_contact_phone: string;
  delivery_instructions?: string;
  
  // Timing
  estimated_pickup_time?: Date;
  estimated_delivery_time?: Date;
  actual_pickup_time?: Date;
  actual_delivery_time?: Date;
  delivery_window_start?: Date;
  delivery_window_end?: Date;
  
  // Financial
  delivery_fee: number;
  driver_commission: number;
  payment_method: PaymentMethod;
  cash_to_collect?: number;
  
  // Distance and route
  estimated_distance: number; // in kilometers
  actual_distance?: number;
  estimated_duration: number; // in minutes
  actual_duration?: number;
  
  // Items information
  items_count: number;
  total_weight?: number;
  special_instructions?: string;
  
  // Proof of delivery
  delivery_photo_url?: string;
  delivery_signature?: string;
  delivery_notes?: string;
  
  // Failure information
  failure_reason?: string;
  return_reason?: string;
  
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, any>;
}

export interface DeliveryAssignment {
  id: string;
  delivery_id: string;
  driver_id: string;
  assigned_at: Date;
  accepted_at?: Date;
  rejected_at?: Date;
  rejection_reason?: string;
  expires_at: Date;
  
  // Assignment details
  estimated_pickup_time: Date;
  estimated_delivery_time: Date;
  offered_commission: number;
  
  // Response tracking
  is_accepted: boolean;
  response_time?: number; // in seconds
  
  created_at: Date;
  updated_at: Date;
}

export interface TrackingEvent {
  id: string;
  delivery_id: string;
  driver_id?: string;
  event_type: TrackingEventType;
  timestamp: Date;
  
  // Location information
  latitude?: number;
  longitude?: number;
  address?: string;
  
  // Event details
  description: string;
  notes?: string;
  photo_url?: string;
  
  // System information
  created_by: string; // 'system', 'driver', 'customer', 'admin'
  source: string; // 'mobile_app', 'web_admin', 'api', 'gps'
  
  created_at: Date;
  metadata?: Record<string, any>;
}

export interface DeliveryRoute {
  id: string;
  driver_id: string;
  route_date: Date;
  deliveries: string[]; // Array of delivery IDs
  optimized_order: number[];
  
  // Route statistics
  total_distance: number;
  total_duration: number;
  total_deliveries: number;
  completed_deliveries: number;
  
  // Status
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  started_at?: Date;
  completed_at?: Date;
  
  created_at: Date;
  updated_at: Date;
}

export interface DeliveryZone {
  id: string;
  name: string;
  description: string;
  boundaries: GeoPolygon;
  is_active: boolean;
  
  // Operational info
  base_delivery_fee: number;
  delivery_time_estimate: number; // in minutes
  available_vehicle_types: VehicleType[];
  
  // Coverage
  covered_areas: string[];
  postal_codes: string[];
  
  created_at: Date;
  updated_at: Date;
}

export interface GeoPolygon {
  coordinates: Array<[number, number]>; // [longitude, latitude] pairs
}

// ============= REQUEST/RESPONSE TYPES =============

export interface CreateDriverRequest {
  full_name: string;
  phone: string;
  email: string;
  vehicle_type: VehicleType;
  vehicle_plate: string;
  vehicle_model?: string;
  vehicle_color?: string;
  license_number: string;
  license_expiry: Date;
  identity_number: string;
  zone_coverage: string[];
  working_start_time: string;
  working_end_time: string;
  working_days: string[];
  commission_rate?: number;
}

export interface UpdateDriverRequest {
  full_name?: string;
  phone?: string;
  email?: string;
  status?: DriverStatus;
  vehicle_type?: VehicleType;
  vehicle_plate?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  license_number?: string;
  license_expiry?: Date;
  zone_coverage?: string[];
  working_start_time?: string;
  working_end_time?: string;
  working_days?: string[];
  commission_rate?: number;
}

export interface CreateDeliveryRequest {
  order_id: string;
  customer_id: string;
  restaurant_id: string;
  partner_id: string;
  priority?: DeliveryPriority;
  
  // Pickup information
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_contact_name: string;
  pickup_contact_phone: string;
  pickup_instructions?: string;
  
  // Delivery information
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  delivery_contact_name: string;
  delivery_contact_phone: string;
  delivery_instructions?: string;
  
  // Timing
  estimated_pickup_time?: Date;
  estimated_delivery_time?: Date;
  delivery_window_start?: Date;
  delivery_window_end?: Date;
  
  // Financial
  delivery_fee: number;
  payment_method: PaymentMethod;
  cash_to_collect?: number;
  
  // Items
  items_count: number;
  total_weight?: number;
  special_instructions?: string;
}

export interface UpdateDeliveryRequest {
  status?: DeliveryStatus;
  priority?: DeliveryPriority;
  driver_id?: string;
  estimated_pickup_time?: Date;
  estimated_delivery_time?: Date;
  delivery_instructions?: string;
  special_instructions?: string;
  failure_reason?: string;
  return_reason?: string;
}

export interface UpdateDriverLocationRequest {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
}

export interface CreateTrackingEventRequest {
  delivery_id: string;
  event_type: TrackingEventType;
  latitude?: number;
  longitude?: number;
  address?: string;
  description: string;
  notes?: string;
  photo_url?: string;
}

export interface DeliveryProofRequest {
  delivery_photo_url?: string;
  delivery_signature?: string;
  delivery_notes?: string;
  customer_present: boolean;
  delivered_to?: string;
}

// ============= FILTER TYPES =============

export interface DriverFilters {
  status?: DriverStatus;
  vehicle_type?: VehicleType;
  zone?: string;
  available_only?: boolean;
  rating_min?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface DeliveryFilters {
  status?: DeliveryStatus;
  driver_id?: string;
  customer_id?: string;
  restaurant_id?: string;
  partner_id?: string;
  priority?: DeliveryPriority;
  payment_method?: PaymentMethod;
  date_from?: Date;
  date_to?: Date;
  zone?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface TrackingEventFilters {
  delivery_id?: string;
  driver_id?: string;
  event_type?: TrackingEventType;
  date_from?: Date;
  date_to?: Date;
  limit?: number;
  offset?: number;
}

// ============= ANALYTICS TYPES =============

export interface DeliveryAnalytics {
  total_deliveries: number;
  completed_deliveries: number;
  success_rate: number;
  average_delivery_time: number;
  total_distance: number;
  total_revenue: number;
  deliveries_by_status: Record<DeliveryStatus, number>;
  deliveries_by_zone: Record<string, number>;
  peak_hours: Array<{
    hour: number;
    delivery_count: number;
  }>;
  top_performing_drivers: Array<{
    driver_id: string;
    driver_name: string;
    deliveries_count: number;
    success_rate: number;
    average_time: number;
    rating: number;
  }>;
}

export interface DriverAnalytics {
  total_drivers: number;
  active_drivers: number;
  drivers_on_delivery: number;
  average_rating: number;
  total_earnings: number;
  drivers_by_status: Record<DriverStatus, number>;
  drivers_by_vehicle: Record<VehicleType, number>;
  driver_performance: Array<{
    driver_id: string;
    driver_name: string;
    deliveries_today: number;
    earnings_today: number;
    rating: number;
    online_hours: number;
  }>;
}

export interface RouteOptimization {
  driver_id: string;
  deliveries: Array<{
    delivery_id: string;
    pickup_lat: number;
    pickup_lng: number;
    delivery_lat: number;
    delivery_lng: number;
    priority: DeliveryPriority;
    estimated_duration: number;
  }>;
  optimized_sequence: number[];
  total_distance: number;
  total_duration: number;
  efficiency_score: number;
}

// ============= REAL-TIME TYPES =============

export interface LocationUpdate {
  driver_id: string;
  delivery_id?: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
  accuracy?: number;
}

export interface DeliveryStatusUpdate {
  delivery_id: string;
  status: DeliveryStatus;
  driver_id?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
  message?: string;
}

export interface DriverStatusUpdate {
  driver_id: string;
  status: DriverStatus;
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
}

// ============= ASSIGNMENT ALGORITHM TYPES =============

export interface DriverAvailability {
  driver_id: string;
  driver_name: string;
  current_latitude: number;
  current_longitude: number;
  distance_to_pickup: number;
  estimated_arrival_time: number;
  current_load: number;
  rating: number;
  vehicle_type: VehicleType;
  zone_match: boolean;
  is_preferred: boolean;
  commission_rate: number;
}

export interface AssignmentCriteria {
  max_distance: number;
  max_assignment_time: number;
  prefer_high_rating: boolean;
  consider_current_load: boolean;
  zone_restriction: boolean;
  vehicle_type_filter?: VehicleType[];
}

export interface AssignmentResult {
  delivery_id: string;
  recommended_drivers: DriverAvailability[];
  assignment_score: number;
  estimated_pickup_time: Date;
  estimated_delivery_time: Date;
  reason: string;
}

// ============= NOTIFICATION TYPES =============

export interface DeliveryNotification {
  type: 'NEW_DELIVERY' | 'STATUS_UPDATE' | 'LOCATION_UPDATE' | 'CANCELLATION';
  delivery_id: string;
  recipient_id: string;
  recipient_type: 'CUSTOMER' | 'DRIVER' | 'RESTAURANT' | 'ADMIN';
  title: string;
  message: string;
  data?: Record<string, any>;
  timestamp: Date;
}

// ============= INTEGRATION TYPES =============

export interface PartnerServiceDeliveryRequest {
  restaurant_id: string;
  partner_id: string;
  restaurant_name: string;
  restaurant_address: string;
  restaurant_latitude: number;
  restaurant_longitude: number;
  restaurant_phone: string;
  estimated_prep_time: number;
}

export interface OrderServiceDeliveryRequest {
  order_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  items_count: number;
  total_weight?: number;
  special_instructions?: string;
  payment_method: PaymentMethod;
  cash_to_collect?: number;
}

export interface PaymentServiceDeliveryFee {
  base_fee: number;
  distance_fee: number;
  time_fee: number;
  surge_multiplier: number;
  total_fee: number;
  currency: string;
}