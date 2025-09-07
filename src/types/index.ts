
export type Artist = {
  id: string;
  name: string;
  email: string;
  password?: string;
  profilePicture: string;
  workImages: string[];
  services: ('mehndi' | 'makeup')[];
  location: string;
  charge: number;
  rating: number;
  styleTags: string[];
};

export type Booking = {
  id: string;
  artistId?: string | null;
  customerName: string;
  customerContact: string;
  serviceAddress: string;
  date: Date;
  service: string;
  amount: number;
  status: 'Completed' | 'Confirmed' | 'Cancelled' | 'Pending Approval' | 'Needs Assignment';
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
