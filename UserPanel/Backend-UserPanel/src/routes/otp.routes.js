const express = require('express');
const { sendOtp } = require('../controllers/otp.controller');
const { otpSendValidators, runValidation } = require('../middleware/validate');
const { otpSendLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.post('/otp/send', otpSendLimiter, otpSendValidators, runValidation, sendOtp);

module.exports = router;
