export interface Payment {
  id: number;
  user_id: number;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_method: string;
  transaction_id: string | null;
  gateway_response: any;
  created_at: Date;
  updated_at: Date;
}

export interface Subscription {
  id: number;
  type: 'basic' | 'premium';
  price: number;
  duration_days: number;
  features: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserSubscription {
  id: number;
  user_id: number;
  subscription_id: number;
  payment_id: number;
  start_date: Date;
  end_date: Date;
  is_active: boolean;
  auto_renew: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  subscription_id: number;
  payment_method: string;
}

export interface SubscriptionCheckResponse {
  is_premium: boolean;
  subscription: UserSubscription | null;
  remaining_days: number | null;
}