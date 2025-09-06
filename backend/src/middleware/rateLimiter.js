import rateLimit from 'express-rate-limit';

// Rate limiter for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator: (req) => {
    // Use IP + User-Agent for more precise rate limiting
    return `${req.ip}-${req.get('User-Agent')}`;
  }
});

// Rate limiter for general API endpoints
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for file uploads (more generous for admin users)
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 uploads per hour (increased from 10)
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admin users (if they have a valid token)
    return req.headers.authorization && req.headers.authorization.startsWith('Bearer ');
  }
});

// Rate limiter for admin uploads (very generous)
export const adminUploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200, // Limit each IP to 200 uploads per hour for admin users
  message: {
    success: false,
    message: 'Too many admin uploads, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Only apply to admin routes
    return !req.path.startsWith('/api/admin');
  }
});

// Rate limiter for contact form submissions
export const contactRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 contact submissions per hour
  message: {
    success: false,
    message: 'Too many contact form submissions, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export default {
  authRateLimit,
  apiRateLimit,
  uploadRateLimit,
  adminUploadRateLimit,
  contactRateLimit
};
