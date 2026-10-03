const { body, validationResult } = require('express-validator');

const PASSWORD_RULE = body('password', 'Password must be at least 8 characters and include a letter and a number')
  .isString()
  .isLength({ min: 8, max: 128 })
  .matches(/[A-Za-z]/)
  .matches(/\d/);

const optionalText = (field, max) => body(field).optional({ values: 'falsy' }).isString().trim().isLength({ max });

const profileRules = [
  body('fullName', 'Full name must be 2-100 characters').isString().trim().isLength({ min: 2, max: 100 }),
  body('phone', 'Enter a valid phone number').optional({ values: 'falsy' }).isString().trim().matches(/^\+?[\d\s-]{7,20}$/),
  optionalText('designation', 100),
  optionalText('department', 150),
  optionalText('location', 100)
];

const signupRules = [
  ...profileRules,
  body('email', 'Enter a valid email address').isString().trim().isEmail().isLength({ max: 254 }).toLowerCase(),
  PASSWORD_RULE
];

const loginRules = [
  body('email', 'Enter a valid email address').isString().trim().isEmail().toLowerCase(),
  body('password', 'Password is required').isString().notEmpty()
];

const updateProfileRules = [...profileRules, optionalText('bio', 1000)];

const changePasswordRules = [
  body('currentPassword', 'Current password is required').isString().notEmpty(),
  body('newPassword', 'New password must be at least 8 characters and include a letter and a number')
    .isString()
    .isLength({ min: 8, max: 128 })
    .matches(/[A-Za-z]/)
    .matches(/\d/)
];

function runValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const list = errors.array({ onlyFirstError: true });
    return res.status(400).json({ ok: false, error: list[0].msg, fields: list.map((e) => e.path) });
  }
  next();
}

module.exports = { signupRules, loginRules, updateProfileRules, changePasswordRules, runValidation };
