




export type ArtistPackage = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  tags: string[];
};

export type Artist = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  profilePicture: string;
  workImages: string[];
  services: ('mehndi' | 'makeup')[];
  location: string;
  charges: {
      mehndi?: number;
      makeup?: number;
  };
  charge: number; // Keep for backward compatibility, but favor `charges`
  rating: number;
  styleTags: string[];
  unavailableDates?: string[]; // ISO date strings
  reviews?: Review[]; // Artist-specific reviews
};

export type Customer = {
  id: string; // Can be email or a unique ID from Firebase/phone auth
  name: string;
  phone: string;
  email?: string;
};


export type Booking = {
  id: string;
  artistIds: (string | null)[];
  customerId: string; // Link to customer
  customerName: string;
  customerContact: string;
  serviceAddress: string;
  date: Date;
  service: string;
  amount: number;
  status: 'Completed' | 'Confirmed' | 'Cancelled' | 'Pending Approval' | 'Needs Assignment' | 'Disputed';
  paidOut?: boolean;
  
  // New detailed fields
  eventType: string;
  eventDate: Date;
  state: string;
  district: string;
  location: string; // Locality/Area
  mapLink?: string;
  note?: string;
  instagramId?: string;
  referencePhoto?: string;
  guestMehndi?: {
    included: boolean;
    expectedCount: number;
  };
};

export type Review = {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
};

export type Notification = {
  id: string;
  artistId: string;
  bookingId: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
};

export type Promotion = {
    id: string;
    code: string;
    discount: number; // Percentage
    expiryDate: string;
    isActive: boolean;
};

export type Payout = {
  artistId: string;
  artistName:string;
  totalBookings: number;
  grossRevenue: number;
  platformFees: number;
  gst: number;
  netPayout: number;
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

export type MehndiPackage = {
    id: string;
    name: string;
    service: 'mehndi' | 'makeup';
    description: string;
    price: number;
    image: string;
    tags: string[];
};
