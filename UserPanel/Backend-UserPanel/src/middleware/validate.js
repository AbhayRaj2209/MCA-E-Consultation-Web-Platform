const { body, validationResult } = require('express-validator');
const { OTP_ENABLED } = require('../services/otp.service');

const ID_TYPES = ['aadhar', 'pan'];
const STAKEHOLDER_TYPES = ['individual', 'ngo', 'industry', 'law', 'consulting'];
const ID_FORMATS = {
  aadhar: /^\d{12}$/,
  pan: /^[A-Z]{5}[0-9]{4}[A-Z]$/
};
const INDIAN_MOBILE = /^[6-9]\d{9}$/;
const PHONE_MSG = 'Valid 10-digit Indian mobile number is required';

const otpSendValidators = [
  body('phone', PHONE_MSG).isString().trim().matches(INDIAN_MOBILE)
];

// body(field, message): message us field ke har check pe default lagta hai
const submitValidators = [
  body('documentId', 'Valid documentId is required').isInt({ min: 1 }).toInt(),
  body('section').optional({ nullable: true }).isString().trim().isLength({ max: 255 }),
  body('commentData', 'Comment is required')
    .isString().trim()
    .isLength({ min: 1, max: 10000 }).withMessage('Comment must be between 1 and 10000 characters'),
  body('commenterName', 'Name is required')
    .isString().trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[\p{L}\p{M} .'-]+$/u).withMessage('Name contains invalid characters'),
  body('commenterEmail', 'Valid email is required').isString().trim().isLength({ max: 254 }).isEmail(),
  body('commenterPhone', PHONE_MSG).isString().trim().matches(INDIAN_MOBILE),
  body('commenterAddress').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
  body('idType', 'idType must be aadhar or pan').isString().isIn(ID_TYPES),
  body('idNumber', 'Invalid Government ID number')
    .isString()
    .customSanitizer((v) => (typeof v === 'string' ? v.replace(/\s/g, '').toUpperCase() : v))
    .custom((value, { req }) => {
      const format = ID_FORMATS[req.body.idType];
      if (!format || !format.test(value)) throw new Error('Invalid Government ID number');
      return true;
    }),
  body('stakeholderType', 'Invalid stakeholderType').isString().isIn(STAKEHOLDER_TYPES),
  body('supportedDocFilename').optional({ nullable: true }).isString().trim().isLength({ max: 255 }),
  ...(OTP_ENABLED ? [body('otp', 'Valid 6-digit OTP is required').isString().trim().matches(/^\d{6}$/)] : [])
];

function runValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const list = errors.array({ onlyFirstError: true });
    return res.status(400).json({
      success: false,
      message: list[0].msg,
      errors: list.map((e) => ({ field: e.param || e.path, msg: e.msg }))
    });
  }
  next();
}

module.exports = { otpSendValidators, submitValidators, runValidation };
