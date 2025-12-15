export interface Coordinates {
  lat: number;
  lon: number;
}

export interface Place {
  id: string;
  name: string;
  category: string;
  address?: string;
  location: Coordinates;
  avg_rating?: number;
  rating_count?: number;
  distance_m?: number | null;
  tags?: string[];
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  nickname: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
}
