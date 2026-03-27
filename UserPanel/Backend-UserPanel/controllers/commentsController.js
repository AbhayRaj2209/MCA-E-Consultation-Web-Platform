const fetch = require('node-fetch');
const commentsModel = require('../models/commentsModel');

// Submit comment/controller: calls FastAPI for sentiment analysis, then inserts into DB
async function submitComment(req, res, next) {
  try {
    const {
      documentId,
      section,
      commentData,
      sentiment,
      summary,
      commenterName,
      commenterEmail,
      commenterPhone,
      commenterAddress,
      idType,
      idNumber,
      stakeholderType,
      supportedDocFilename,
      supportedDocData
    } = req.body;

    // Validate required fields
    if (!documentId || !commenterName || !commenterEmail || !commenterPhone ||
        !idType || !idNumber || !stakeholderType || !commentData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: ['documentId', 'commenterName', 'commenterEmail', 'commenterPhone', 'idType', 'idNumber', 'stakeholderType', 'commentData']
      });
    }

    // Initialize sentiment analysis
    let predictedSentiment = sentiment || 'neutral';
    let predictedSummary = summary || null;
    let confidence = 0.0;
    let strongOpinion = false;
    let keywords = [];

    const fastApiUrl = process.env.FASTAPI_URL || 'http://127.0.0.1:8001';

    try {
      const sentimentResp = await fetch(`${fastApiUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentData })
      });

      if (sentimentResp.ok) {
        const sentimentData = await sentimentResp.json();

        predictedSentiment = sentimentData.sentiment || 'neutral';
        confidence = sentimentData.confidence || 0.0;
        strongOpinion = sentimentData.strong_opinion || false;
        keywords = sentimentData.keywords || [];

        if (sentimentData.processed_text) {
          predictedSummary = sentimentData.processed_text;
        }

        console.log(`Sentiment analysis: ${predictedSentiment} (${(confidence * 100).toFixed(1)}%)`);
      } else {
        console.warn('FastAPI service error:', sentimentResp.status);
      }
    } catch (e) {
      console.error('FastAPI error:', e.message || e);
    }

    const values = [
      documentId,
      section || null,
      commentData,
      predictedSentiment,
      predictedSummary,
      supportedDocData || null,
      supportedDocFilename || null,
      commenterName,
      commenterEmail,
      commenterPhone,
      commenterAddress || null,
      idType,
      idNumber,
      stakeholderType,
      confidence,
      strongOpinion,
      JSON.stringify(keywords)
    ];

    const result = await commentsModel.insertComment(values);

    res.status(201).json({
      success: true,
      message: 'Comment submitted successfully',
      data: result,
      sentiment: {
        sentiment: predictedSentiment,
        confidence: confidence,
        strong_opinion: strongOpinion,
        keywords: keywords
      }
    });

  } catch (error) {
    next(error);
  }
}

async function getCommentsByDocument(req, res, next) {
  try {
    const { documentId } = req.params;
    if (!documentId) return res.status(400).json({ success: false, message: 'Document ID is required' });

    const rows = await commentsModel.getByDocument(documentId);
    res.status(200).json({ success: true, data: rows });

  } catch (error) {
    next(error);
  }
}

async function getAllComments(req, res, next) {
  try {
    const rows = await commentsModel.getAll();
    res.status(200).json({ success: true, data: rows });

  } catch (error) {
    next(error);
  }
}

async function updateComment(req, res, next) {
  try {
    const { commentId } = req.params;
    const { commentData, sentiment, summary } = req.body;

    if (!commentId || !commentData) {
      return res.status(400).json({
        success: false,
        message: 'Comment ID and comment data are required'
      });
    }

    const updated = await commentsModel.updateComment(
      commentId,
      commentData,
      sentiment || null,
      summary || null
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: updated
    });

  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitComment,
  getCommentsByDocument,
  getAllComments,
  updateComment
};