export type Category = 'cafe' | 'restaurant' | 'convenience' | 'salon' | string;

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  nickname: string;
  createdAt: string;
}

export interface Place {
  id: string;
  name: string;
  category: string;
  address?: string;
  location: {
    lat: number;
    lon: number;
  };
  avg_rating?: number;
  rating_count?: number;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Review {
  id: string;
  placeId: string;
  userId: string;
  nickname: string;
  rating: number;
  comment?: string;
  createdAt: string;
}
