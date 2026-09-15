export type Accreditation = 'NABL' | 'CAP';

export type Lab = {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  price: number;
  reportTime: string;
  accreditations: Accreditation[];
  specialties: string[];
  verified?: boolean;
  partner?: boolean;
  accent: string;
};
