// Payment Status Enums
export enum PaymentStatus {
  PENDING = 'PENDING',           // Thanh toán đang chờ xử lý
  PROCESSING = 'PROCESSING',     // Đang xử lý thanh toán
  COMPLETED = 'COMPLETED',       // Thanh toán thành công
  FAILED = 'FAILED',            // Thanh toán thất bại
  CANCELLED = 'CANCELLED',      // Thanh toán bị hủy
  REFUNDED = 'REFUNDED',        // Đã hoàn tiền
  PARTIAL_REFUNDED = 'PARTIAL_REFUNDED' // Hoàn tiền một phần
}

export enum PaymentMethod {
  APPLE_PAY = 'APPLE_PAY',      // Apple Pay
  PAYOS = 'PAYOS',              // PayOS Vietnam
  CREDIT_CARD = 'CREDIT_CARD',  // Thẻ tín dụng
  DEBIT_CARD = 'DEBIT_CARD',    // Thẻ ghi nợ
  BANK_TRANSFER = 'BANK_TRANSFER', // Chuyển khoản ngân hàng
  E_WALLET = 'E_WALLET',        // Ví điện tử
  CASH = 'CASH'                 // Tiền mặt
}

export enum RefundStatus {
  PENDING = 'PENDING',          // Yêu cầu hoàn tiền đang chờ
  PROCESSING = 'PROCESSING',    // Đang xử lý hoàn tiền
  COMPLETED = 'COMPLETED',      // Hoàn tiền thành công
  FAILED = 'FAILED',           // Hoàn tiền thất bại
  CANCELLED = 'CANCELLED'       // Hủy yêu cầu hoàn tiền
}

export enum TransactionType {
  PAYMENT = 'PAYMENT',          // Thanh toán
  REFUND = 'REFUND',           // Hoàn tiền
  CHARGEBACK = 'CHARGEBACK',   // Tranh chấp
  FEE = 'FEE'                  // Phí dịch vụ
}

export enum PaymentGateway {
  APPLE_PAY = 'APPLE_PAY',
  PAYOS = 'PAYOS',
  MOCK_GATEWAY = 'MOCK_GATEWAY' // Gateway ảo để test
}

// Core Payment Interface
export interface Payment {
  id: string;
  user_id: string;
  order_id?: string;
  
  // Payment Information
  payment_method: PaymentMethod;
  payment_gateway: PaymentGateway;
  status: PaymentStatus;
  
  // Financial Details
  amount: number;                // Số tiền thanh toán (VND)
  currency: string;              // Tiền tệ (VND, USD)
  exchange_rate?: number;        // Tỷ giá (nếu có)
  fee_amount: number;            // Phí giao dịch
  net_amount: number;            // Số tiền thực nhận
  
  // Gateway Information
  gateway_transaction_id?: string; // ID giao dịch từ gateway
  gateway_payment_url?: string;   // URL thanh toán từ gateway
  gateway_response?: any;         // Response từ gateway (JSON)
  
  // Customer Information
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  
  // Payment Details
  description?: string;          // Mô tả giao dịch
  reference_code?: string;       // Mã tham chiếu
  return_url?: string;          // URL trả về sau thanh toán
  cancel_url?: string;          // URL hủy thanh toán
  webhook_url?: string;         // URL webhook
  
  // Apple Pay Specific
  apple_pay_token?: string;     // Apple Pay token
  apple_pay_merchant_id?: string; // Merchant ID cho Apple Pay
  
  // PayOS Specific
  payos_order_code?: string;    // Mã đơn hàng PayOS
  payos_checkout_url?: string;  // URL checkout PayOS
  payos_qr_code?: string;       // QR code PayOS
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  expired_at?: Date;            // Thời gian hết hạn thanh toán
  completed_at?: Date;          // Thời gian hoàn thành
  failed_at?: Date;             // Thời gian thất bại
}

// Transaction Record
export interface Transaction {
  id: string;
  payment_id: string;
  
  // Transaction Details
  type: TransactionType;
  status: PaymentStatus;
  amount: number;
  currency: string;
  fee_amount: number;
  
  // Gateway Information
  gateway_transaction_id?: string;
  gateway_response?: any;
  
  // Reference Information
  reference_payment_id?: string; // ID thanh toán gốc (cho refund)
  description?: string;
  notes?: string;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  processed_at?: Date;
}

// Refund Request
export interface RefundRequest {
  id: string;
  payment_id: string;
  user_id: string;
  
  // Refund Details
  status: RefundStatus;
  refund_amount: number;        // Số tiền hoàn
  refund_reason: string;        // Lý do hoàn tiền
  refund_type: 'FULL' | 'PARTIAL'; // Loại hoàn tiền
  
  // Gateway Information
  gateway_refund_id?: string;   // ID hoàn tiền từ gateway
  gateway_response?: any;       // Response từ gateway
  
  // Processing Information
  processed_by?: string;        // ID người xử lý
  admin_notes?: string;         // Ghi chú từ admin
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  processed_at?: Date;
  completed_at?: Date;
}

// Payment Creation Request
export interface CreatePaymentRequest {
  order_id?: string;
  payment_method: PaymentMethod;
  payment_gateway: PaymentGateway;
  amount: number;
  currency?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  description?: string;
  return_url?: string;
  cancel_url?: string;
  
  // Apple Pay specific
  apple_pay_token?: string;
  apple_pay_merchant_id?: string;
  
  // PayOS specific
  payos_order_code?: string;
  payos_items?: PayOSItem[];
}

export interface PayOSItem {
  name: string;
  quantity: number;
  price: number;
}

// Payment Update Request
export interface UpdatePaymentRequest {
  status?: PaymentStatus;
  gateway_transaction_id?: string;
  gateway_response?: any;
  notes?: string;
}

// Refund Creation Request
export interface CreateRefundRequest {
  payment_id: string;
  refund_amount: number;
  refund_reason: string;
  refund_type: 'FULL' | 'PARTIAL';
}

// Payment Query Filters
export interface PaymentFilters {
  status?: PaymentStatus;
  payment_method?: PaymentMethod;
  payment_gateway?: PaymentGateway;
  order_id?: string;
  customer_email?: string;
  start_date?: Date;
  end_date?: Date;
  min_amount?: number;
  max_amount?: number;
  limit?: number;
  offset?: number;
}

// Payment Statistics
export interface PaymentStats {
  total_payments: number;
  successful_payments: number;
  failed_payments: number;
  pending_payments: number;
  refunded_payments: number;
  total_amount: number;
  total_refunded: number;
  average_payment_amount: number;
  success_rate: number;
  
  // Gateway breakdown
  apple_pay_count: number;
  apple_pay_amount: number;
  payos_count: number;
  payos_amount: number;
  
  // Fee analysis
  total_fees: number;
  net_revenue: number;
}

// Apple Pay Payment Token
export interface ApplePayToken {
  paymentData: {
    version: string;
    data: string;
    signature: string;
    header: {
      ephemeralPublicKey: string;
      publicKeyHash: string;
      transactionId: string;
    };
  };
  paymentMethod: {
    displayName: string;
    network: string;
    type: string;
  };
  transactionIdentifier: string;
}

// PayOS Payment Request
export interface PayOSPaymentRequest {
  orderCode: string;
  amount: number;
  description: string;
  items: PayOSItem[];
  cancelUrl: string;
  returnUrl: string;
  signature?: string;
}

// PayOS Payment Response
export interface PayOSPaymentResponse {
  error: number;
  message: string;
  data?: {
    bin: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    description: string;
    orderCode: string;
    currency: string;
    paymentLinkId: string;
    status: string;
    checkoutUrl: string;
    qrCode: string;
  };
}

// Gateway Webhook Data
export interface WebhookData {
  gateway: PaymentGateway;
  event_type: string;
  payment_id: string;
  transaction_id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  timestamp: Date;
  signature?: string;
  raw_data: any;
}

// Payment Summary (for list responses)
export interface PaymentSummary {
  id: string;
  order_id?: string;
  payment_method: PaymentMethod;
  payment_gateway: PaymentGateway;
  status: PaymentStatus;
  amount: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  description?: string;
  created_at: Date;
  completed_at?: Date;
}

// Payment with details (for detailed responses)
export interface PaymentWithDetails extends Payment {
  transactions?: Transaction[];
  refund_requests?: RefundRequest[];
}

export default {
  PaymentStatus,
  PaymentMethod,
  RefundStatus,
  TransactionType,
  PaymentGateway
};