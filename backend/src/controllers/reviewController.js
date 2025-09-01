import Review from '../models/review.js';

// POST /api/reviews
export const createReview = async (req, res, next) => {
  try {
    const { name, email, rating, comment, source } = req.body || {};

    if (!rating || !comment?.trim()) {
      return res.status(400).json({ success: false, message: 'Rating and comment are required' });
    }

    const doc = await Review.create({
      name: name?.trim() || 'Anonymous',
      email: email?.trim() || undefined,
      rating: Number(rating),
      comment: comment.trim(),
      source: source || 'website',
      approved: true,
    });

    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

// GET /api/reviews
export const getReviews = async (req, res, next) => {
  try {
    const { limit = 20, approved = 'true' } = req.query;
    const query = {};
    if (approved === 'true') query.approved = true;

    const docs = await Review.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 20, 100));

    return res.json({ success: true, data: docs });
  } catch (err) {
    next(err);
  }
};
