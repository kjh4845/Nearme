import api from './client';
import type { Place, Review } from '../types';

type NearbyParams = {
  lat: number;
  lon: number;
  radius?: number;
  category?: string;
};

export async function fetchNearby(params: NearbyParams) {
  const res = await api.get<Place[]>('/places/nearby', { params });
  return res.data;
}

type BboxParams = {
  top_left: { lat: number; lon: number };
  bottom_right: { lat: number; lon: number };
  category?: string;
};

export async function fetchWithinBox(params: BboxParams) {
  const res = await api.post<Place[]>('/places/within-bbox', params);
  return res.data;
}

export async function fetchPlace(id: string) {
  const res = await api.get<Place>(`/places/${id}`);
  return res.data;
}

export async function fetchReviews(id: string) {
  const res = await api.get<Review[]>(`/places/${id}/reviews`);
  return res.data;
}

export async function addReview(id: string, payload: { rating: number; comment?: string }) {
  const res = await api.post<Review>(`/places/${id}/reviews`, payload);
  return res.data;
}
