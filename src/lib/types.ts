export interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  costPrice: number;
  stock?: number;
  category: string;
  image?: string;
  isPopular?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem extends Product {
  quantity: number;
  isCustomPrice?: boolean;
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

export interface PurchaseRecord {
  id?: string;
  staffId: string;
  timestamp: any;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  subtotalAmount: number;
  discountAmount: number;
  paymentMode: string;
  isOfflineSale: boolean;
  customerId: string | null;
  customerName: string | null;
}

export interface CashTransaction {
  id?: string;
  type: 'IN' | 'OUT';
  amount: number;
  reason: string;
  timestamp: any;
  staffId: string;
}