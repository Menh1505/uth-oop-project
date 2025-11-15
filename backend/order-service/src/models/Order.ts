// Order Status Enums - Lifecycle Management
export enum OrderStatus {
  PENDING = 'PENDING',           // Đơn hàng mới tạo, chờ xác nhận
  CONFIRMED = 'CONFIRMED',       // Đã xác nhận, chuẩn bị chế biến
  PREPARING = 'PREPARING',       // Đang chế biến món ăn
  READY = 'READY',              // Món ăn đã sẵn sàng
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', // Đang giao hàng
  DELIVERED = 'DELIVERED',       // Đã giao thành công
  CANCELLED = 'CANCELLED',       // Đã hủy
  REFUNDED = 'REFUNDED'         // Đã hoàn tiền
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum DeliveryType {
  DELIVERY = 'DELIVERY',     // Giao hàng
  PICKUP = 'PICKUP',         // Lấy tại cửa hàng
  DINE_IN = 'DINE_IN'       // Ăn tại chỗ
}

export enum OrderPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// Core Order Interface
export interface Order {
  id: string;
  user_id: string;
  restaurant_id?: string;
  
  // Order Details
  order_number: string;          // Mã đơn hàng duy nhất
  status: OrderStatus;
  payment_status: PaymentStatus;
  delivery_type: DeliveryType;
  priority: OrderPriority;
  
  // Financial Information
  subtotal: number;              // Tổng tiền món ăn
  tax_amount: number;            // Tiền thuế
  delivery_fee: number;          // Phí giao hàng
  discount_amount: number;       // Giảm giá
  total_amount: number;          // Tổng tiền cuối cùng
  
  // Customer Information
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  
  // Delivery Information
  delivery_address?: string;
  delivery_notes?: string;
  delivery_time?: Date;          // Thời gian giao hàng dự kiến
  actual_delivery_time?: Date;   // Thời gian giao hàng thực tế
  
  // Order Timing
  estimated_prep_time?: number;  // Thời gian chuẩn bị (phút)
  special_instructions?: string; // Ghi chú đặc biệt
  
  // Metadata
  created_at: Date;
  updated_at: Date;
  confirmed_at?: Date;
  cancelled_at?: Date;
  delivered_at?: Date;
}

// Order Item Interface
export interface OrderItem {
  id: string;
  order_id: string;
  
  // Product Information
  product_id: string;            // ID của món ăn/sản phẩm
  product_name: string;          // Tên món ăn
  product_description?: string;  // Mô tả món ăn
  category?: string;             // Danh mục món ăn
  
  // Pricing
  unit_price: number;            // Giá đơn vị
  quantity: number;              // Số lượng
  total_price: number;           // Tổng giá (unit_price * quantity)
  
  // Customization
  customizations?: string[];     // Tùy chỉnh món ăn (size, topping, etc.)
  special_requests?: string;     // Yêu cầu đặc biệt
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

// Order Status History for tracking
export interface OrderStatusHistory {
  id: string;
  order_id: string;
  previous_status?: OrderStatus;
  new_status: OrderStatus;
  changed_by: string;            // User ID who changed status
  reason?: string;               // Lý do thay đổi
  notes?: string;                // Ghi chú thêm
  created_at: Date;
}

// Order Creation Request
export interface CreateOrderRequest {
  restaurant_id?: string;
  delivery_type: DeliveryType;
  priority?: OrderPriority;
  
  // Customer Info
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  
  // Delivery Info (required if delivery_type = DELIVERY)
  delivery_address?: string;
  delivery_notes?: string;
  delivery_time?: string;        // ISO string
  
  // Order Items
  items: CreateOrderItemRequest[];
  
  // Special Instructions
  special_instructions?: string;
  estimated_prep_time?: number;
  
  // Discount/Coupon
  coupon_code?: string;
}

export interface CreateOrderItemRequest {
  product_id: string;
  product_name: string;
  product_description?: string;
  category?: string;
  unit_price: number;
  quantity: number;
  customizations?: string[];
  special_requests?: string;
}

// Order Update Request
export interface UpdateOrderRequest {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  priority?: OrderPriority;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  delivery_address?: string;
  delivery_notes?: string;
  delivery_time?: string;
  estimated_prep_time?: number;
  special_instructions?: string;
}

// Order Query Filters
export interface OrderFilters {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  delivery_type?: DeliveryType;
  priority?: OrderPriority;
  restaurant_id?: string;
  customer_phone?: string;
  order_number?: string;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
  offset?: number;
}

// Order Statistics
export interface OrderStats {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  preparing_orders: number;
  ready_orders: number;
  out_for_delivery_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  average_order_value: number;
  average_prep_time: number;
}

// Order with Items (for detailed responses)
export interface OrderWithItems extends Order {
  items: OrderItem[];
  status_history?: OrderStatusHistory[];
}

// Order Summary (for list responses)
export interface OrderSummary {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  delivery_type: DeliveryType;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  item_count: number;
  created_at: Date;
  estimated_delivery_time?: Date;
}

// Valid status transitions for business logic
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [OrderStatus.REFUNDED],
  [OrderStatus.REFUNDED]: [] // Terminal state
};

export default {
  OrderStatus,
  PaymentStatus,
  DeliveryType,
  OrderPriority,
  ORDER_STATUS_TRANSITIONS
};