const express = require('express');
const documents = require('../controllers/document.controller');

const router = express.Router();

router.get('/documents', documents.listDocuments);
router.get('/documents/:id', documents.getDocument);
router.get('/documents/:id/attachment', documents.getAttachment);
router.get('/documents/:id/summary', documents.getSummary);
router.get('/documents/:id/audio-proxy', documents.audioProxy);

module.exports = router;
