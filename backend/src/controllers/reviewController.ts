import { Response } from 'express';
import { v4 as uuid } from 'uuid';
import { addReview, getReviews } from '../data/store';
import { AuthRequest } from '../middlewares/auth';

export async function listReviews(req: AuthRequest, res: Response) {
  const placeId = req.params.id;
  const reviews = getReviews(placeId);
  res.json(reviews);
}

export async function createReview(req: AuthRequest, res: Response) {
  const placeId = req.params.id;
  const { rating, comment } = req.body || {};
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'rating must be between 1 and 5' });
  }
  const review = {
    id: uuid(),
    placeId,
    userId: req.user.id,
    nickname: req.user.nickname,
    rating,
    comment,
    createdAt: new Date().toISOString(),
  };
  addReview(placeId, review);
  res.status(201).json(review);
}
