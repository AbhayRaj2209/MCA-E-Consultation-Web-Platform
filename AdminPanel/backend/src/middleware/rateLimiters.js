const rateLimit = require('express-rate-limit');

const limiter = (windowMs, limit, error) => rateLimit({
  windowMs,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error }
});

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

// Per IP limits
const loginLimiter = limiter(FIFTEEN_MINUTES, 10, 'Too many login attempts. Please try again in 15 minutes.');
const signupLimiter = limiter(ONE_HOUR, 5, 'Too many accounts created from this network. Please try again later.');
const submitLimiter = limiter(FIFTEEN_MINUTES, 20, 'Too many submissions. Please try again later.');

module.exports = { loginLimiter, signupLimiter, submitLimiter };
