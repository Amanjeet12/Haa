export type Lab = {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  price: number;
  reportTime: string;
  certifications: string[];
  specialties: string[];
  verified?: boolean;
  partner?: boolean;
  accent: string;
  image?: string;
  banner?: string;
  address?: string;
};
