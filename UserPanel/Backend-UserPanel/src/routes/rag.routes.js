const express = require('express');
const rag = require('../controllers/rag.controller');

const router = express.Router();

router.post('/rag/chat', rag.chat);

module.exports = router;
