const { sendOtp } = require('../services/otp.service');

// POST /api/otp/send
async function sendOtpHandler(req, res, next) {
  try {
    await sendOtp(req.body.phone);
    res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { sendOtp: sendOtpHandler };
