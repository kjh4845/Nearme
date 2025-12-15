import { Router } from 'express';
import { getNearby, getPlace, getWithinBbox } from '../controllers/placesController';
import { createReview, listReviews } from '../controllers/reviewController';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.get('/nearby', getNearby);
router.post('/within-bbox', getWithinBbox);
router.get('/:id', getPlace);
router.get('/:id/reviews', listReviews);
router.post('/:id/reviews', requireAuth, createReview);

export default router;
