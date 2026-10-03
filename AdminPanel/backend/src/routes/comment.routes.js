const express = require('express');
const comments = require('../controllers/comment.controller');
const { requireAuth } = require('../middleware/auth');
const { submitLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

// Admin-only reads (citizen personal data)
router.get('/recent-activity', requireAuth, comments.getRecentActivity);
router.get('/comments/:bill', requireAuth, comments.getCommentsByBill);
router.get('/admin/comments', requireAuth, comments.getAdminComments);

// Public submissions (no login), rate limited
router.post('/comments/:bill', submitLimiter, comments.createComment);
router.post('/submit-comment', submitLimiter, comments.submitComment);

module.exports = router;
