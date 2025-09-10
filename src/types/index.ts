
import { Timestamp } from 'firebase/firestore';

export type PackageCategory = {
  name: 'Normal' | 'Premium' | 'ULTRA PREMIUM';
  description: string;
  basePrice: number;
  image?: string;
};

export type MasterServicePackage = {
  id: string;
  name: string;
  service: 'mehndi' | 'makeup' | 'photography';
  description: string;
  image: string;
  tags: string[];
  categories: PackageCategory[];
};

export type ArtistServiceOffering = {
    masterPackageId: string;
    categoryName: 'Normal' | 'Premium' | 'ULTRA PREMIUM';
    artistPrice: number;
    isEnabled: boolean;
};

export type Artist = {
  id: string; // Firebase Auth UID
  name: string;
  email: string;
  phone: string;
  fcmToken?: string;
  profilePicture: string;
  workImages: string[];
  services: ('mehndi' | 'makeup' | 'photography')[];
  serviceOfferings?: ArtistServiceOffering[];
  location: string;
  charges: {
      mehndi?: number;
      makeup?: number;
      photography?: number;
  };
  charge: number; // Keep for backward compatibility, but favor `charges`
  rating: number;
  styleTags: string[];
  unavailableDates?: string[]; // ISO date strings
  reviews?: Review[]; // Artist-specific reviews
  // New detailed location fields
  state?: string;
  district?: string;
  locality?: string;
  servingAreas?: string;
  referralCode?: string;
  referralDiscount?: number; // Percentage, e.g., 10 for 10%
  status?: 'active' | 'suspended';
};

export type Customer = {
  id: string; // Firebase Auth UID
  name: string;
  phone: string;
  email?: string;
  fcmToken?: string;
};

export type CartItem = {
    masterPackage: MasterServicePackage;
    category: PackageCategory;
    artist?: Artist; // Optional: if an artist is chosen for this item
};

export type Booking = {
  id: string;
  artistIds: string[];
  customerId: string; // Link to customer
  customerName: string;
  customerContact?: string;
  serviceAddress: string;
  date: Timestamp; // For backward compatibility & main date
  serviceDates: Timestamp[]; // For multi-day bookings
  service: string;
  amount: number;
  status: 'Completed' | 'Confirmed' | 'Cancelled' | 'Pending Approval' | 'Needs Assignment' | 'Disputed' | 'Pending Confirmation';
  paidOut?: boolean;
  completionCode?: string; // Unique 6-digit code for completion verification
  
  // New detailed fields
  eventType: string;
  eventDate: Timestamp;
  state: string;
  district: string;
  location: string; // Locality/Area
  mapLink?: string;
  note?: string;
  instagramId?: string;
  referencePhoto?: string;
  paymentMethod?: 'online' | 'offline';
  guestMehndi?: {
    included: boolean;
    expectedCount: number;
  };
  guestMakeup?: {
    included: boolean;
    expectedCount: number;
  };
  appliedReferralCode?: string;
};

export type Review = {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
};

export type Notification = {
  id: string;
  artistId?: string; // Optional for bulk notifications
  customerId?: string; // Optional for bulk notifications
  bookingId?: string; // Optional, for context
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'booking' | 'payout' | 'announcement';
};

export type Promotion = {
    id: string;
    code: string;
    discount: number; // Percentage
    expiryDate?: string;
    isActive: boolean;
    usageLimit?: number; // How many times a single customer can use this code. 0 for unlimited.
};

export type Payout = {
  artistId: string;
  artistName:string;
  totalBookings: number;
  grossRevenue: number; // From online bookings this payout cycle
  payoutDue: number; // Money owed to artist from online bookings
  commissionOwed: number; // Commission owed by artist from offline bookings
  platformFees: number;
  gst: number;
  netPayout: number; // The final settlement amount (payoutDue - commissionOwed)
  bookingIds: string[];
};

export type PayoutHistory = Payout & {
  id: string;
  paymentDate: string;
}

export type Transaction = {
  id: string;
  date: Date;
  type: 'Revenue' | 'Payout' | 'Refund';
  description: string;
  amount: number;
  relatedId: string;
};

// This is now the Master Service Package definition
export type ServicePackage = MasterServicePackage;

// Maintained for backward compatibility in some files
export type MehndiPackage = ServicePackage;


export type Permission = 'edit' | 'view' | 'hidden';

export type Permissions = {
  dashboard: Permission;
  bookings: Permission;
  artists: Permission;
  customers: Permission;
  artistDirectory: Permission;
  payouts: Permission;
  transactions: Permission;
  packages: Permission;
  settings: Permission;
  notifications: Permission;
};

export type TeamMember = {
    id: string; // Firebase Auth UID
    name: string;
    username: string;
    role: 'Super Admin' | 'team-member';
    permissions: Permissions;
    fcmToken?: string;
};
