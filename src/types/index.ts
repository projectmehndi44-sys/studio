
export type Artist = {
  id: string;
  name: string;
  email: string;
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
