const express = require('express');
const { getConsultations } = require('../controllers/consultation.controller');
const { getDocuments, createDocument } = require('../controllers/document.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/consultations', requireAuth, getConsultations);
router.get('/documents', requireAuth, getDocuments);
router.post('/documents', requireAuth, createDocument);

module.exports = router;
