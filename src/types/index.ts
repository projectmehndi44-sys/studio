export type Artist = {
  id: string;
  name: string;
  profilePicture: string;
  workImages: string[];
  services: ('mehndi' | 'makeup')[];
  location: string;
  charge: number;
  rating: number;
  styleTags: string[];
};
