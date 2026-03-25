
import { Product, Customer, Coupon } from './types';
import { PlaceHolderImages } from './placeholder-images';

export const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Amul Milk 500ml', barcode: '8901231001', price: 27, costPrice: 24, stock: 150, category: 'Dairy', image: PlaceHolderImages.find(i => i.id === 'amul-milk')?.imageUrl, isPopular: true },
  { id: '2', name: 'Amul Taza 1L', barcode: '8901231002', price: 54, costPrice: 48, stock: 80, category: 'Dairy', image: PlaceHolderImages.find(i => i.id === 'amul-milk')?.imageUrl, isPopular: true },
  { id: '3', name: 'Wheat Bread', barcode: '8901231003', price: 40, costPrice: 32, stock: 45, category: 'Bakery', image: PlaceHolderImages.find(i => i.id === 'bread')?.imageUrl, isPopular: true },
  { id: '4', name: 'Fresh Eggs (6pc)', barcode: '8901231004', price: 42, costPrice: 35, stock: 20, category: 'Poultry', image: PlaceHolderImages.find(i => i.id === 'eggs')?.imageUrl, isPopular: true },
  { id: '5', name: 'Sunflower Oil 1L', barcode: '8901231005', price: 165, costPrice: 140, stock: 60, category: 'Staples', image: PlaceHolderImages.find(i => i.id === 'cooking-oil')?.imageUrl, isPopular: true },
  { id: '6', name: 'Basmati Rice 5kg', barcode: '8901231006', price: 550, costPrice: 480, stock: 15, category: 'Staples', image: PlaceHolderImages.find(i => i.id === 'rice')?.imageUrl, isPopular: true },
  { id: '7', name: 'Sugar 1kg', barcode: '8901231007', price: 45, costPrice: 38, stock: 100, category: 'Staples', image: PlaceHolderImages.find(i => i.id === 'sugar')?.imageUrl, isPopular: true },
  { id: '8', name: 'Tata Tea 250g', barcode: '8901231008', price: 120, costPrice: 105, stock: 40, category: 'Beverages', image: PlaceHolderImages.find(i => i.id === 'tea')?.imageUrl, isPopular: true },
  { id: '9', name: 'Hide & Seek', barcode: '8901231009', price: 30, costPrice: 25, stock: 75, category: 'Snacks', image: PlaceHolderImages.find(i => i.id === 'biscuit')?.imageUrl, isPopular: true },
  { id: '10', name: 'Dettol Soap', barcode: '8901231010', price: 35, costPrice: 28, stock: 120, category: 'Personal Care', image: PlaceHolderImages.find(i => i.id === 'soap')?.imageUrl, isPopular: true },
  { id: '11', name: 'Surf Excel 1kg', barcode: '8901231011', price: 180, costPrice: 155, stock: 35, category: 'Cleaning', image: PlaceHolderImages.find(i => i.id === 'detergent')?.imageUrl, isPopular: true },
];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', phone: '9876543210', name: 'John Doe', points: 450, lastVisit: '2023-10-01', history: [] },
  { id: 'c2', phone: '9999999999', name: 'Ananya Sharma', points: 120, lastVisit: '2023-05-15', history: [] },
];

export const MOCK_COUPONS: Coupon[] = [
  { code: 'SUPER9', type: 'flat', value: 50, minBill: 500, expiry: '2024-12-31' },
  { code: 'WELCOMEOFF', type: 'percent', value: 10, minBill: 200, maxDiscount: 100, expiry: '2024-12-31' },
];
