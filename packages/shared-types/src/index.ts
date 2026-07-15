export type OrderStatus = 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  user: { id: string; email: string; name: string; role: string };
}

export interface DashboardStats {
  revenue: number;
  totalOrders: number;
  activeOrders: number;
}

export interface Category {
  id: string;
  name: string;
  image?: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  foodItems?: FoodItem[];
  _count?: { foodItems: number };
}

export interface ProductionStock {
  id: string;
  foodItemId: string;
  availableQty: number;
}

export interface FoodItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isVeg: boolean;
  isEnabled: boolean;
  isPopular: boolean;
  isTodaysSpecial: boolean;
  createdAt: string;
  category?: Category;
  productionStock?: ProductionStock | null;
  _lowStock?: boolean;
}

export interface OrderItem {
  id: string;
  foodItemId: string;
  quantity: number;
  unitPrice: string;
  specialInstructions?: string;
  foodItem?: { name: string };
}

export interface Order {
  id: string;
  status: OrderStatus | string;
  total: string;
  subtotal: string;
  tax: string;
  discount: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  customerId?: string | null;
  cancelReason?: string | null;
  customer?: { id: string; email?: string; name?: string } | null;
  orderItems?: OrderItem[];
}

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  period: { days: number; since: string };
  revenueTrend: { date: string; revenue: number }[];
  popularItems: { name: string; count: number; revenue: number }[];
  peakHours: { hour: number; label: string; orders: number }[];
  paymentBreakdown: { status: string; count: number }[];
  discountStats: {
    totalDiscountGiven: number;
    discountOrderCount: number;
    discountPercentage: number;
    averageDiscountPerOrder: number;
  };
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  value: number;
  validFrom: string;
  validTo: string;
  usageLimit: number | null;
  usageCount: number;
  createdAt: string;
}
