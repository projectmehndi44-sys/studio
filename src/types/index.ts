
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
  customerName: string;
  date: Date;
  service: string;
  amount: number;
  status: 'Completed' | 'Confirmed' | 'Cancelled';
};

export type Review = {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
};
