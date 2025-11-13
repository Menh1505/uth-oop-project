// ============= ENUMS =============

export enum PartnerStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BLOCKED = 'BLOCKED',
  INACTIVE = 'INACTIVE'
}

export enum RestaurantType {
  FAST_FOOD = 'FAST_FOOD',
  CASUAL_DINING = 'CASUAL_DINING',
  FINE_DINING = 'FINE_DINING',
  CAFE = 'CAFE',
  BAKERY = 'BAKERY',
  STREET_FOOD = 'STREET_FOOD',
  VEGETARIAN = 'VEGETARIAN',
  SEAFOOD = 'SEAFOOD',
  BBQ = 'BBQ',
  ASIAN = 'ASIAN',
  WESTERN = 'WESTERN',
  VIETNAMESE = 'VIETNAMESE'
}

export enum RestaurantStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  BUSY = 'BUSY',
  TEMPORARILY_CLOSED = 'TEMPORARILY_CLOSED',
  PERMANENTLY_CLOSED = 'PERMANENTLY_CLOSED'
}

export enum MenuItemStatus {
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED'
}

export enum MenuItemCategory {
  APPETIZER = 'APPETIZER',
  MAIN_COURSE = 'MAIN_COURSE',
  DESSERT = 'DESSERT',
  BEVERAGE = 'BEVERAGE',
  SIDE_DISH = 'SIDE_DISH',
  SOUP = 'SOUP',
  SALAD = 'SALAD',
  PIZZA = 'PIZZA',
  BURGER = 'BURGER',
  NOODLES = 'NOODLES',
  RICE = 'RICE',
  VEGETARIAN = 'VEGETARIAN',
  VEGAN = 'VEGAN'
}

export enum PromotionType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  BUY_ONE_GET_ONE = 'BUY_ONE_GET_ONE',
  FREE_DELIVERY = 'FREE_DELIVERY',
  BUNDLE = 'BUNDLE'
}

export enum PromotionStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export enum InventoryStatus {
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED'
}

// ============= INTERFACES =============

export interface Partner {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  tax_id: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  status: PartnerStatus;
  commission_rate: number;
  joined_date: Date;
  last_active: Date;
  total_restaurants: number;
  total_revenue: number;
  rating: number;
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, any>;
}

export interface Restaurant {
  id: string;
  partner_id: string;
  name: string;
  description: string;
  type: RestaurantType;
  status: RestaurantStatus;
  phone: string;
  email: string;
  website?: string;
  
  // Address information
  address: string;
  city: string;
  district: string;
  ward: string;
  latitude: number;
  longitude: number;
  
  // Business hours
  opening_hours: Record<string, { open: string; close: string; is_closed: boolean }>;
  
  // Financial information
  delivery_fee: number;
  minimum_order: number;
  delivery_radius: number; // in kilometers
  
  // Ratings and reviews
  rating: number;
  total_reviews: number;
  
  // Images
  logo_url?: string;
  cover_image_url?: string;
  gallery_images: string[];
  
  // Features
  features: string[]; // ['delivery', 'pickup', 'dine_in', 'wifi', 'parking']
  
  // Menu stats
  total_menu_items: number;
  
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, any>;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  catalog_item_id?: string; // Link to catalog service
  name: string;
  description: string;
  category: MenuItemCategory;
  status: MenuItemStatus;
  
  // Pricing
  base_price: number;
  sale_price?: number;
  currency: string;
  
  // Nutrition and dietary
  calories?: number;
  ingredients: string[];
  allergens: string[];
  dietary_info: string[]; // ['vegetarian', 'vegan', 'gluten_free', 'halal']
  
  // Images and media
  image_url?: string;
  gallery_images: string[];
  
  // Availability
  available_days: string[]; // ['monday', 'tuesday', ...]
  available_times: { start: string; end: string }[];
  
  // Inventory link
  inventory_tracked: boolean;
  
  // Popularity
  order_count: number;
  rating: number;
  total_reviews: number;
  
  // Customization options
  customization_options: MenuItemCustomization[];
  
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, any>;
}

export interface MenuItemCustomization {
  id: string;
  name: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT_INPUT';
  required: boolean;
  options: CustomizationOption[];
}

export interface CustomizationOption {
  id: string;
  name: string;
  additional_price: number;
  available: boolean;
}

export interface Promotion {
  id: string;
  restaurant_id: string;
  partner_id: string;
  name: string;
  description: string;
  type: PromotionType;
  status: PromotionStatus;
  
  // Discount details
  discount_value: number; // percentage or fixed amount
  max_discount_amount?: number;
  min_order_amount?: number;
  
  // Validity
  start_date: Date;
  end_date: Date;
  usage_limit?: number;
  usage_count: number;
  usage_per_customer?: number;
  
  // Applicable items
  applicable_items: string[]; // menu item IDs
  applicable_categories: MenuItemCategory[];
  
  // Conditions
  applicable_days: string[];
  applicable_times: { start: string; end: string }[];
  
  // Promo code
  promo_code?: string;
  auto_apply: boolean;
  
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, any>;
}

export interface Inventory {
  id: string;
  restaurant_id: string;
  menu_item_id: string;
  ingredient_name: string;
  status: InventoryStatus;
  
  // Stock levels
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  unit: string; // 'kg', 'pieces', 'liters', etc.
  
  // Cost information
  cost_per_unit: number;
  supplier_name?: string;
  supplier_contact?: string;
  
  // Tracking
  last_restocked: Date;
  expiry_date?: Date;
  
  // Alerts
  low_stock_alert: boolean;
  expiry_alert: boolean;
  
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, any>;
}

// ============= REQUEST/RESPONSE TYPES =============

export interface CreatePartnerRequest {
  business_name: string;
  business_type: string;
  tax_id: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  commission_rate?: number;
}

export interface UpdatePartnerRequest {
  business_name?: string;
  business_type?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  status?: PartnerStatus;
  commission_rate?: number;
}

export interface CreateRestaurantRequest {
  name: string;
  description: string;
  type: RestaurantType;
  phone: string;
  email: string;
  website?: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  latitude: number;
  longitude: number;
  opening_hours: Record<string, { open: string; close: string; is_closed: boolean }>;
  delivery_fee: number;
  minimum_order: number;
  delivery_radius: number;
  logo_url?: string;
  cover_image_url?: string;
  gallery_images?: string[];
  features?: string[];
}

export interface UpdateRestaurantRequest {
  name?: string;
  description?: string;
  type?: RestaurantType;
  status?: RestaurantStatus;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
  latitude?: number;
  longitude?: number;
  opening_hours?: Record<string, { open: string; close: string; is_closed: boolean }>;
  delivery_fee?: number;
  minimum_order?: number;
  delivery_radius?: number;
  logo_url?: string;
  cover_image_url?: string;
  gallery_images?: string[];
  features?: string[];
}

export interface CreateMenuItemRequest {
  name: string;
  description: string;
  category: MenuItemCategory;
  base_price: number;
  sale_price?: number;
  currency?: string;
  calories?: number;
  ingredients?: string[];
  allergens?: string[];
  dietary_info?: string[];
  image_url?: string;
  gallery_images?: string[];
  available_days?: string[];
  available_times?: { start: string; end: string }[];
  inventory_tracked?: boolean;
  customization_options?: MenuItemCustomization[];
  catalog_item_id?: string;
}

export interface UpdateMenuItemRequest {
  name?: string;
  description?: string;
  category?: MenuItemCategory;
  status?: MenuItemStatus;
  base_price?: number;
  sale_price?: number;
  calories?: number;
  ingredients?: string[];
  allergens?: string[];
  dietary_info?: string[];
  image_url?: string;
  gallery_images?: string[];
  available_days?: string[];
  available_times?: { start: string; end: string }[];
  inventory_tracked?: boolean;
  customization_options?: MenuItemCustomization[];
}

export interface CreatePromotionRequest {
  name: string;
  description: string;
  type: PromotionType;
  discount_value: number;
  max_discount_amount?: number;
  min_order_amount?: number;
  start_date: Date;
  end_date: Date;
  usage_limit?: number;
  usage_per_customer?: number;
  applicable_items?: string[];
  applicable_categories?: MenuItemCategory[];
  applicable_days?: string[];
  applicable_times?: { start: string; end: string }[];
  promo_code?: string;
  auto_apply?: boolean;
}

export interface UpdatePromotionRequest {
  name?: string;
  description?: string;
  status?: PromotionStatus;
  discount_value?: number;
  max_discount_amount?: number;
  min_order_amount?: number;
  start_date?: Date;
  end_date?: Date;
  usage_limit?: number;
  usage_per_customer?: number;
  applicable_items?: string[];
  applicable_categories?: MenuItemCategory[];
  applicable_days?: string[];
  applicable_times?: { start: string; end: string }[];
  promo_code?: string;
  auto_apply?: boolean;
}

export interface CreateInventoryRequest {
  menu_item_id: string;
  ingredient_name: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  unit: string;
  cost_per_unit: number;
  supplier_name?: string;
  supplier_contact?: string;
  expiry_date?: Date;
}

export interface UpdateInventoryRequest {
  ingredient_name?: string;
  status?: InventoryStatus;
  current_stock?: number;
  minimum_stock?: number;
  maximum_stock?: number;
  unit?: string;
  cost_per_unit?: number;
  supplier_name?: string;
  supplier_contact?: string;
  last_restocked?: Date;
  expiry_date?: Date;
  low_stock_alert?: boolean;
  expiry_alert?: boolean;
}

// ============= FILTER TYPES =============

export interface PartnerFilters {
  status?: PartnerStatus;
  business_type?: string;
  city?: string;
  min_rating?: number;
  min_revenue?: number;
  joined_after?: Date;
  joined_before?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface RestaurantFilters {
  partner_id?: string;
  type?: RestaurantType;
  status?: RestaurantStatus;
  city?: string;
  district?: string;
  min_rating?: number;
  delivery_available?: boolean;
  features?: string[];
  latitude?: number;
  longitude?: number;
  radius?: number; // search radius in km
  search?: string;
  limit?: number;
  offset?: number;
}

export interface MenuItemFilters {
  restaurant_id?: string;
  category?: MenuItemCategory;
  status?: MenuItemStatus;
  min_price?: number;
  max_price?: number;
  dietary_info?: string[];
  available_now?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PromotionFilters {
  restaurant_id?: string;
  partner_id?: string;
  type?: PromotionType;
  status?: PromotionStatus;
  active_now?: boolean;
  promo_code?: string;
  limit?: number;
  offset?: number;
}

export interface InventoryFilters {
  restaurant_id?: string;
  status?: InventoryStatus;
  low_stock_only?: boolean;
  expiring_soon?: boolean;
  ingredient_name?: string;
  limit?: number;
  offset?: number;
}

// ============= ANALYTICS TYPES =============

export interface PartnerAnalytics {
  total_partners: number;
  active_partners: number;
  new_partners_this_month: number;
  total_revenue: number;
  average_commission_rate: number;
  top_performing_partners: Array<{
    partner_id: string;
    business_name: string;
    revenue: number;
    restaurant_count: number;
  }>;
}

export interface RestaurantAnalytics {
  total_restaurants: number;
  open_restaurants: number;
  average_rating: number;
  top_rated_restaurants: Array<{
    restaurant_id: string;
    name: string;
    rating: number;
    total_reviews: number;
  }>;
  restaurants_by_type: Record<RestaurantType, number>;
  restaurants_by_city: Record<string, number>;
}

export interface MenuAnalytics {
  total_menu_items: number;
  available_items: number;
  average_price: number;
  popular_categories: Array<{
    category: MenuItemCategory;
    item_count: number;
    total_orders: number;
  }>;
  top_selling_items: Array<{
    item_id: string;
    name: string;
    restaurant_name: string;
    order_count: number;
    revenue: number;
  }>;
}

export interface InventoryAnalytics {
  total_inventory_items: number;
  low_stock_items: number;
  out_of_stock_items: number;
  expiring_soon_items: number;
  inventory_value: number;
  top_costly_items: Array<{
    item_id: string;
    ingredient_name: string;
    restaurant_name: string;
    cost_per_unit: number;
    current_stock: number;
    total_value: number;
  }>;
}