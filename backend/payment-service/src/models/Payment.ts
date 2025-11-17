// Payment Status
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';

// Payment Method
export type PaymentMethod = 'credit_card' | 'debit_card' | 'paypal' | 'stripe' | 'bank_transfer';

// Subscription Type
export type SubscriptionType = 'free' | 'basic' | 'premium' | 'enterprise';

// Payment interface
export interface Payment {
  id: string;
  user_id: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  transaction_id?: string;
  gateway_response?: Record<string, any>;
  created_at?: string | Date;
  updated_at?: string | Date;
}

// Payment Request
export interface PaymentRequest {
  subscription_id: number;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
}

// Subscription interface
export interface Subscription {
  id: number;
  name: string;
  type: SubscriptionType;
  description?: string;
  price: number;
  currency: string;
  billing_cycle: string; // 'monthly', 'yearly'
  features: string[];
  max_users?: number;
  storage_gb?: number;
  api_calls_per_month?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// User Subscription interface
export interface UserSubscription {
  id: string;
  user_id: number;
  subscription_id: number;
  status: string;
  start_date: string | Date;
  end_date: string | Date;
  auto_renew: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  subscription_type?: SubscriptionType;
  features?: string[];
}

// Subscription Check Response
export interface SubscriptionCheckResponse {
  is_premium: boolean;
  subscription: UserSubscription | null;
  remaining_days: number | null;
}

// Payment History interface
export interface PaymentHistory {
  id: string;
  user_id: number;
  payment_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string;
  created_at?: string | Date;
}

// Refund Request
export interface RefundRequest {
  payment_id: string;
  reason: string;
  amount?: number;
}

// Refund Response
export interface RefundResponse {
  success: boolean;
  refund_id?: string;
  message: string;
  original_payment_id?: string;
  refund_amount?: number;
}

// Invoice interface
export interface Invoice {
  id: string;
  user_id: number;
  payment_id: string;
  subscription_id: number;
  amount: number;
  tax?: number;
  total: number;
  issue_date: string | Date;
  due_date: string | Date;
  status: string;
  pdf_url?: string;
}

// Usage Record
export interface UsageRecord {
  user_id: number;
  api_calls: number;
  storage_used_gb: number;
  period: string;
  created_at?: string;
}

// Payment Analytics
export interface PaymentAnalytics {
  total_revenue: number;
  total_payments: number;
  successful_payments: number;
  failed_payments: number;
  refunded_amount: number;
  mrr: number; // Monthly Recurring Revenue
  churn_rate: number;
  active_subscriptions: number;
}

// JWT Claims
export interface JwtClaims {
  sub: string;
  id: string;
  aud?: string;
}
