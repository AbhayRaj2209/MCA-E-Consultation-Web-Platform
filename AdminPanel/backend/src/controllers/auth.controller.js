const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_ROUNDS, allowedSignupDomains } = require('../config/auth');

// Email exist na kare tab bhi bcrypt compare chalta hai, taaki response time se pata na chale
const DUMMY_HASH = bcrypt.hashSync('timing-safe-dummy-password', BCRYPT_ROUNDS);

const signToken = (user) =>
  jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { algorithm: 'HS256', expiresIn: JWT_EXPIRES_IN });

const emptyToNull = (v) => (v === undefined || v === '' ? null : v);

// POST /api/auth/signup
async function signup(req, res, next) {
  try {
    const { fullName, email, password, phone, designation, department, location } = req.body;

    if (allowedSignupDomains.length) {
      const domain = email.split('@')[1];
      if (!allowedSignupDomains.some((d) => domain === d || domain.endsWith(`.${d}`))) {
        return res.status(403).json({ ok: false, error: 'Sign up is restricted to official email addresses.' });
      }
    }

    if (await userModel.findByEmailWithHash(email)) {
      return res.status(409).json({ ok: false, error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await userModel.create({
      fullName,
      email,
      passwordHash,
      phone: emptyToNull(phone),
      designation: emptyToNull(designation),
      department: emptyToNull(department),
      location: emptyToNull(location)
    });

    await userModel.touchLastLogin(user.id);
    res.status(201).json({ ok: true, data: { token: signToken(user), user } });
  } catch (err) {
    // Do requests ek saath same email se aaye to unique constraint pakadta hai
    if (err.code === '23505') {
      return res.status(409).json({ ok: false, error: 'An account with this email already exists.' });
    }
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const record = await userModel.findByEmailWithHash(email);

    const valid = await bcrypt.compare(password, record ? record.password_hash : DUMMY_HASH);
    if (!record || !valid) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password.' });
    }

    const { password_hash: _omit, ...user } = record;
    await userModel.touchLastLogin(user.id);

    // last_login_at = pichla login (abhi wala nahi), header me "Last login" dikhane ke liye
    res.json({ ok: true, data: { token: signToken(user), user } });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function me(req, res, next) {
  try {
    const user = await userModel.findById(req.userId);
    if (!user) return res.status(401).json({ ok: false, error: 'Account no longer exists.' });
    res.json({ ok: true, data: user });
  } catch (err) {
    next(err);
  }
}

// PUT /api/auth/me
async function updateMe(req, res, next) {
  try {
    const { fullName, phone, designation, department, location, bio } = req.body;
    const user = await userModel.updateProfile(req.userId, {
      fullName,
      phone: emptyToNull(phone),
      designation: emptyToNull(designation),
      department: emptyToNull(department),
      location: emptyToNull(location),
      bio: emptyToNull(bio)
    });
    if (!user) return res.status(401).json({ ok: false, error: 'Account no longer exists.' });
    res.json({ ok: true, data: user });
  } catch (err) {
    next(err);
  }
}

// PUT /api/auth/password
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const hash = await userModel.getPasswordHash(req.userId);
    if (!hash) return res.status(401).json({ ok: false, error: 'Account no longer exists.' });

    if (!(await bcrypt.compare(currentPassword, hash))) {
      return res.status(400).json({ ok: false, error: 'Current password is incorrect.' });
    }

    await userModel.updatePasswordHash(req.userId, await bcrypt.hash(newPassword, BCRYPT_ROUNDS));
    res.json({ ok: true, message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, me, updateMe, changePassword };
