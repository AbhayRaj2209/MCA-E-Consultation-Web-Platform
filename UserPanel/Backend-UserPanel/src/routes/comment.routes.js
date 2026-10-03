const express = require('express');
const { submitComment } = require('../controllers/comment.controller');
const { submitValidators, runValidation } = require('../middleware/validate');
const { submitLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

// Comments sirf Admin Panel backend se padhe jaate hain; yahan koi public read route nahi (citizen PII)
router.post('/submit-comment', submitLimiter, submitValidators, runValidation, submitComment);

module.exports = router;
