const express = require('express');
const analysis = require('../controllers/analysis.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/sentiment/:bill', requireAuth, analysis.getSentimentCounts);
router.get('/summaries/:bill', requireAuth, analysis.getSummaries);
router.get('/sections/:bill', requireAuth, analysis.getSectionSummaries);
router.get('/section-sentiments/:bill', requireAuth, analysis.getSectionSentiments);
router.post('/generate-overview/:bill', requireAuth, analysis.generateOverview);

module.exports = router;
