import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  name: { type: String, trim: true, maxlength: 100 },
  email: { type: String, trim: true, lowercase: true, maxlength: 120 },
  rating: { type: Number, required: true, min: 1, max: 5, index: true },
  comment: { type: String, required: true, trim: true, maxlength: 2000 },
  source: { type: String, enum: ['website', 'facebook', 'instagram', 'other'], default: 'website', index: true },
  approved: { type: Boolean, default: true, index: true },
}, { timestamps: true });

export default mongoose.model('Review', reviewSchema);
