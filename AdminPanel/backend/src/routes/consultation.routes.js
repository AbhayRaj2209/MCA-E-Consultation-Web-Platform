const express = require('express');
const { getConsultations } = require('../controllers/consultation.controller');
const documents = require('../controllers/document.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/consultations', requireAuth, getConsultations);
router.get('/documents', requireAuth, documents.getDocuments);
router.post('/documents', requireAuth, documents.createDocument);
router.patch('/documents/:id/archive', requireAuth, documents.setArchived);
router.delete('/documents/:id', requireAuth, documents.deleteDocument);

module.exports = router;
