export interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  costPrice: number;
  stock?: number; // Optional inventory
  category: string;
  image?: string;
  isPopular?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  isQuickItem?: boolean;
}

export interface Coupon {
  code: string;
  type: 'flat' | 'percent';
  value: number;
  minBill: number;
  maxDiscount?: number;
  expiry: string;
}

export interface Customer {
  id: string;
  phone: string;
  name: string;
  points: number;
  lastVisit: string;
  history: string[];
}

export interface Sale {
  id: string;
  timestamp: string;
  items: CartItem[];
  total: number;
  profit: number;
  paymentMode: 'Cash' | 'UPI' | 'Credit';
  customerPhone?: string;
  discount: number;
  staffId: string;
}