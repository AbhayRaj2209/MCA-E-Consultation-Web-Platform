const express = require('express');
const auth = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');
const { loginLimiter, signupLimiter } = require('../middleware/rateLimiters');
const {
  signupRules, loginRules, updateProfileRules, changePasswordRules, runValidation
} = require('../middleware/validate');

const router = express.Router();

router.post('/auth/signup', signupLimiter, signupRules, runValidation, auth.signup);
router.post('/auth/login', loginLimiter, loginRules, runValidation, auth.login);
router.get('/auth/me', requireAuth, auth.me);
router.put('/auth/me', requireAuth, updateProfileRules, runValidation, auth.updateMe);
router.put('/auth/password', requireAuth, changePasswordRules, runValidation, auth.changePassword);

module.exports = router;
