const crypto = require('crypto');
const AppError = require('../utils/AppError');
const { maskPhone } = require('../utils/mask');

// OTP_PROVIDER=twilio  -> real SMS via Twilio Verify (production)
// OTP_PROVIDER=console -> OTP server log me print hota hai (sirf local testing ke liye)
const PROVIDER = (process.env.OTP_PROVIDER || 'twilio').toLowerCase();

// OTP_ENABLED=true hone par hi feedback submit se pehle OTP maanga jaata hai
const OTP_ENABLED = process.env.OTP_ENABLED === 'true';

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_SENDS_PER_HOUR = 5;

const toE164 = (phone) => `+91${phone}`;

// Per-phone send throttling (Twilio Verify ke saath bhi SMS-bombing rokne ke liye)
const sendLog = new Map();

// Purani entries hata deta hai taaki memory na badhe
setInterval(() => {
  const now = Date.now();
  for (const [phone, times] of sendLog) {
    if (!times.some((t) => now - t < 60 * 60 * 1000)) sendLog.delete(phone);
  }
  for (const [phone, entry] of consoleStore) {
    if (now > entry.expiresAt) consoleStore.delete(phone);
  }
}, 10 * 60 * 1000).unref();

function checkSendThrottle(phone) {
  const now = Date.now();
  const recent = (sendLog.get(phone) || []).filter((t) => now - t < 60 * 60 * 1000);
  const last = recent[recent.length - 1];

  if (last && now - last < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((RESEND_COOLDOWN_MS - (now - last)) / 1000);
    throw new AppError(`Please wait ${wait} seconds before requesting another OTP.`, 429);
  }
  if (recent.length >= MAX_SENDS_PER_HOUR) {
    throw new AppError('Too many OTP requests for this number. Please try again later.', 429);
  }

  recent.push(now);
  sendLog.set(phone, recent);
}

// ---------- console provider (local testing) ----------
const consoleStore = new Map();

const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex');

async function consoleSend(phone) {
  const code = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
  consoleStore.set(phone, { hash: hashCode(code), expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
  console.log(`[OTP console] OTP for +91 ${maskPhone(phone)}: ${code}`);
}

async function consoleVerify(phone, code) {
  const entry = consoleStore.get(phone);
  if (!entry || Date.now() > entry.expiresAt) {
    consoleStore.delete(phone);
    return false;
  }
  entry.attempts += 1;
  if (entry.attempts > MAX_VERIFY_ATTEMPTS) {
    consoleStore.delete(phone);
    throw new AppError('Too many incorrect attempts. Please request a new OTP.', 429);
  }
  const ok = crypto.timingSafeEqual(Buffer.from(entry.hash), Buffer.from(hashCode(code)));
  if (ok) consoleStore.delete(phone);
  return ok;
}

// ---------- Twilio Verify provider ----------
let twilioClient = null;

function getTwilio() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
    throw new AppError('OTP service is not configured. Please try again later.', 503);
  }
  if (!twilioClient) {
    twilioClient = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return twilioClient.verify.v2.services(TWILIO_VERIFY_SERVICE_SID);
}

async function twilioSend(phone) {
  try {
    await getTwilio().verifications.create({ to: toE164(phone), channel: 'sms' });
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('Twilio send error:', err.code, err.message);
    if (err.code === 60203) {
      throw new AppError('Too many OTP requests for this number. Please try again later.', 429);
    }
    if (err.code === 60200 || err.code === 21211) {
      throw new AppError('This phone number cannot receive an OTP. Please check the number.', 400);
    }
    throw new AppError('Could not send OTP right now. Please try again later.', 502);
  }
}

async function twilioVerify(phone, code) {
  try {
    const check = await getTwilio().verificationChecks.create({ to: toE164(phone), code });
    return check.status === 'approved';
  } catch (err) {
    if (err instanceof AppError) throw err;
    // 20404: koi pending verification nahi (expired / already used / max attempts)
    if (err.status === 404 || err.code === 20404) return false;
    if (err.code === 60202) {
      throw new AppError('Too many incorrect attempts. Please request a new OTP.', 429);
    }
    console.error('Twilio verify error:', err.code, err.message);
    throw new AppError('Could not verify OTP right now. Please try again later.', 502);
  }
}

// ---------- public API ----------
async function sendOtp(phone) {
  checkSendThrottle(phone);
  if (PROVIDER === 'console') return consoleSend(phone);
  return twilioSend(phone);
}

async function verifyOtp(phone, code) {
  if (PROVIDER === 'console') return consoleVerify(phone, code);
  return twilioVerify(phone, code);
}

if (OTP_ENABLED && PROVIDER === 'console') {
  console.warn('WARNING: OTP_PROVIDER=console - OTPs are printed to the server log, not sent by SMS. Do not use in production.');
}

module.exports = { OTP_ENABLED, sendOtp, verifyOtp };
