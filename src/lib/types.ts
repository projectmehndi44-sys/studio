import type { Timestamp } from 'firebase/firestore';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
}

export type BenefitImage = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

export type HeroSettings = {
  slideshowText: string;
}

export type PromotionalImage = {
    imageUrl: string;
}

export type PackageCategory = {
  name: 'Normal' | 'Premium' | 'Ultra Premium';
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
    categoryName: 'Normal' | 'Premium' | 'Ultra Premium';
    artistPrice: number;
    isEnabled: boolean;
};

export type ServiceArea = {
  id: string; // for React key prop
  state: string;
  district: string;
  localities: string; // Comma-separated string of localities
}

export type Artist = {
  id: string; // Firestore Document ID. Should be synced with Firebase Auth UID after password creation.
  name: string;
  email: string;
  phone: string;
  fcmToken?: string;
  profilePicture: string;
  coverPhoto?: string; // New field for the cover photo
  workImages: string[];
  services: ('mehndi' | 'makeup' | 'photography')[];
  serviceOfferings?: ArtistServiceOffering[];
  location: string; // Main display location string
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
  serviceAreas: ServiceArea[]; // New structured service areas
  referralCode?: string;
  referralDiscount?: number; // Percentage, e.g., 10 for 10%
  status?: 'active' | 'suspended';
  showContactInfo?: boolean; // New privacy field
  // New fields for one-time password setup
  firstTimeLoginCode?: string;
  firstTimeLoginCodeUsed?: boolean;
  password?: string; // This is a temporary client-side property, it should not be stored in Firestore
  verified?: boolean;
  isFoundersClubMember?: boolean;
  role?: string;
};

export type Customer = {
  id: string; // Firebase Auth UID
  name?: string;
  phone: string;
  email?: string;
  fcmToken?: string;
  status?: 'Active' | 'Suspended';
  createdOn?: Timestamp;
};

export type CartItem = {
    id: string;
    servicePackage: MasterServicePackage;
    selectedTier: PackageCategory;
    artist?: Artist; // Undefined for Express Booking
    price: number;
};

export type Booking = {
  id: string;
  artistIds: string[];
  adminIds?: string[];
  customerId: string; // Link to customer
  customerName: string;
  customerContact?: string;
  alternateContact?: string;
  serviceAddress: string;
  items: CartItem[];
  amount: number;
  status: 'Completed' | 'Confirmed' | 'Cancelled' | 'Pending Approval' | 'Needs Assignment' | 'Disputed' | 'Pending Confirmation';
  paidOut?: boolean;
  completionCode?: string; // Unique 6-digit code for completion verification
  
  // New detailed fields
  eventType: string;
  eventDate: Date;
  serviceDates: Date[];
  state: string;
  district: string;
  locality: string;
  mapLink?: string;
  note?: string;
  travelCharges?: number; // This is a NOTE, not added to total.
  instagramId?: string;
  referencePhoto?: string;
  paymentMethod: 'online' | 'offline';
  guestMehndi?: {
    included: boolean;
    expectedCount: number;
  };
  guestMakeup?: {
    included: boolean;
    expectedCount: number;
  };
  appliedReferralCode?: string;
  reviewSubmitted?: boolean;
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
  type: 'booking' | 'payout' | 'announcement' | 'review_request';
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
// AI Recommendation Type
export interface RawArtistRecommendation {
  artistId: string;
  name: string;
  profilePicture?: string;
  location: string;
  serviceTypes: ('mehndi' | 'makeup' | 'photography')[];
  styleTags: string[];
  charge: number;
  reason: string;
}
