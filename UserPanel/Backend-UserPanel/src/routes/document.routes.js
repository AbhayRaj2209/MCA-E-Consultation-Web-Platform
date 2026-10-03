const express = require('express');
const { getSummary, audioProxy } = require('../controllers/document.controller');

const router = express.Router();

router.get('/documents/:id/summary', getSummary);
router.get('/documents/:id/audio-proxy', audioProxy);

module.exports = router;
