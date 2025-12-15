import { User, Review } from '../types';

export const userStore: Map<string, User> = new Map();
export const reviewStore: Map<string, Review[]> = new Map();

export function addReview(placeId: string, review: Review) {
  const list = reviewStore.get(placeId) || [];
  list.push(review);
  reviewStore.set(placeId, list);
}

export function getReviews(placeId: string): Review[] {
  return reviewStore.get(placeId) || [];
}

export function findUserByEmail(email: string): User | undefined {
  return Array.from(userStore.values()).find((u) => u.email === email);
}
