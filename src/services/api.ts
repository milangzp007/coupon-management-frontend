import { Coupon, CouponUsage, Order, User, CreateCouponDto, CreateOrderDto, ValidateCouponDto, ValidateCouponResponse, RecommendCouponDto, RecommendCouponResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiService {
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth APIs
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    return this.request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    phone: string;
    role?: 'customer' | 'admin';
    referralCode?: string;
  }): Promise<Omit<User, 'password'>> {
    return this.request<Omit<User, 'password'>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Customer Coupon APIs
  async getAvailableCoupons(): Promise<Coupon[]> {
    return this.request<Coupon[]>('/coupons/available');
  }

  async validateCoupon(code: string, data: ValidateCouponDto): Promise<ValidateCouponResponse> {
    return this.request<ValidateCouponResponse>(`/coupons/${code}/validate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async applyCoupon(code: string, data: CreateOrderDto): Promise<{ discount: number; finalAmount: number }> {
    return this.request<{ discount: number; finalAmount: number }>(`/coupons/${code}/apply`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyUsage(): Promise<CouponUsage[]> {
    return this.request<CouponUsage[]>('/coupons/my-usage');
  }

  async recommendCoupons(data: RecommendCouponDto): Promise<RecommendCouponResponse> {
    return this.request<RecommendCouponResponse>('/coupons/recommend', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Order APIs
  async createOrder(data: CreateOrderDto): Promise<Order> {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelOrder(orderId: string): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}`, {
      method: 'DELETE',
    });
  }

  // Admin APIs
  async createCoupon(data: CreateCouponDto): Promise<Coupon> {
    return this.request<Coupon>('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAllCoupons(filters?: {
    isActive?: boolean;
    discountType?: string;
    userSegment?: string;
    search?: string;
  }): Promise<Coupon[]> {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.discountType) params.append('discountType', filters.discountType);
    if (filters?.userSegment) params.append('userSegment', filters.userSegment);
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString();
    return this.request<Coupon[]>(`/admin/coupons${query ? `?${query}` : ''}`);
  }

  async getCouponById(id: string): Promise<Coupon> {
    return this.request<Coupon>(`/admin/coupons/${id}`);
  }

  async updateCoupon(id: string, data: Partial<CreateCouponDto>): Promise<Coupon> {
    return this.request<Coupon>(`/admin/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleCouponStatus(id: string): Promise<Coupon> {
    return this.request<Coupon>(`/admin/coupons/${id}/toggle-status`, {
      method: 'PATCH',
    });
  }

  async deleteCoupon(id: string): Promise<void> {
    return this.request<void>(`/admin/coupons/${id}`, {
      method: 'DELETE',
    });
  }

  async getCouponAnalytics(id: string): Promise<any> {
    return this.request<any>(`/admin/coupons/${id}/analytics`);
  }

  async getCouponUsageReport(filters?: {
    startDate?: string;
    endDate?: string;
    couponId?: string;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.couponId) params.append('couponId', filters.couponId);

    const query = params.toString();
    return this.request<any>(`/admin/reports/coupon-usage${query ? `?${query}` : ''}`);
  }

  async getTopCoupons(limit: number = 10): Promise<any> {
    return this.request<any>(`/admin/reports/top-coupons?limit=${limit}`);
  }

  async getRevenueImpact(filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const query = params.toString();
    return this.request<any>(`/admin/reports/revenue-impact${query ? `?${query}` : ''}`);
  }
}

export const apiService = new ApiService();

