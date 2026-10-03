const rateLimit = require('express-rate-limit');

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const limiter = (limit, message) => rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message }
});

// Per IP, per 15 minutes
const globalLimiter = limiter(
  Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 300,
  'Too many requests. Please try again later.'
);
const otpSendLimiter = limiter(10, 'Too many OTP requests. Please try again later.');
const submitLimiter = limiter(20, 'Too many submissions. Please try again later.');

module.exports = { globalLimiter, otpSendLimiter, submitLimiter };
