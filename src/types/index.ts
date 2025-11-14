export type DiscountType = 'percentage' | 'fixed_amount' | 'free_delivery';
export type UserSegment = 'all' | 'new_users' | 'premium_users';
export type CouponStatus = 'applied' | 'refunded' | 'expired';
export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';
export type UserRole = 'customer' | 'admin';

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscountCap?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  totalUsageLimit?: number;
  perUserLimit?: number;
  currentUsageCount: number;
  applicableCategories?: string[];
  applicableProducts?: string[];
  userSegment?: UserSegment;
  minPurchaseCount?: number;
  excludedCategories?: string[];
  excludedProducts?: string[];
  paymentMethods?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CouponUsage {
  id: string;
  couponId: string;
  userId: string;
  orderId: string;
  discountApplied: number;
  orderValue: number;
  finalOrderValue: number;
  usedAt: string;
  status: CouponStatus;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  isNewUser: boolean;
  isPremiumUser: boolean;
  totalOrders: number;
  totalSpent: number;
  joinedAt: string;
  isActive: boolean;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
}

export interface Order {
  id: string;
  userId: string;
  orderValue: number;
  discountAmount: number;
  finalAmount: number;
  appliedCouponCode?: string;
  items: OrderItem[];
  paymentMethod: string;
  status: OrderStatus;
  createdAt: string;
}

export interface CartItem extends OrderItem {}

// DTOs for API requests
export interface CreateCouponDto {
  code: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscountCap?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  totalUsageLimit?: number;
  perUserLimit?: number;
  applicableCategories?: string[];
  applicableProducts?: string[];
  userSegment?: UserSegment;
  minPurchaseCount?: number;
  excludedCategories?: string[];
  excludedProducts?: string[];
  paymentMethods?: string[];
}

export interface CreateOrderDto {
  orderValue: number;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    category?: string;
  }>;
  paymentMethod: string;
  couponCode?: string;
  deliveryCharge?: number;
}

export interface ValidateCouponDto {
  cartValue: number;
  items?: Array<{
    productId: string;
    category?: string;
    quantity?: number;
    price?: number;
  }>;
  paymentMethod?: string;
}

export interface ValidateCouponResponse {
  valid: boolean;
  discount?: number;
  message?: string;
  nonApplicableItems?: Array<{
    productId: string;
    category?: string;
    reason: string;
  }>;
  itemDiscounts?: Array<{
    productId: string;
    discount: number;
    originalPrice: number;
  }>;
}

export interface RecommendCouponDto {
  cartValue: number;
  items?: Array<{
    productId: string;
    category?: string;
    quantity?: number;
    price?: number;
  }>;
  userId?: string;
}

export interface RecommendedCoupon {
  code: string;
  potentialSavings: number;
  coupon: Coupon;
}

export interface RecommendCouponResponse {
  bestCoupon: RecommendedCoupon | null;
  alternativeCoupons: RecommendedCoupon[];
}
