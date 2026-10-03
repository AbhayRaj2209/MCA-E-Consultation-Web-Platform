const crypto = require('crypto');

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  // Server chalta rahe, lekin restart par sab users ko dobara login karna padega
  jwtSecret = crypto.randomBytes(48).toString('hex');
  console.warn('WARNING: JWT_SECRET is not set - using a temporary secret. Users will be logged out on restart.');
}

// Optional: sirf in email domains se signup allowed (e.g. "gov.in,nic.in"); khali = sab allowed
const allowedSignupDomains = (process.env.ALLOWED_SIGNUP_DOMAINS || '')
  .split(',')
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

module.exports = {
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  BCRYPT_ROUNDS: 10,
  allowedSignupDomains
};
