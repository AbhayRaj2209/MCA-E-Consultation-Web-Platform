const fetch = require('node-fetch');
const commentsModel = require('../models/commentsModel');

<<<<<<< HEAD
// Submit comment/controller: agar ML API configured hai to use call karke enrichment karta hai, phir model se DB me insert karta hai
=======
// Submit comment/controller: calls FastAPI for sentiment analysis, then inserts into DB
>>>>>>> 1450b5da7249fafe8c4969259a9e799d9158605f
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

<<<<<<< HEAD
    // Zaroori fields ko validate kare
=======
    // Validate required fields
>>>>>>> 1450b5da7249fafe8c4969259a9e799d9158605f
    if (!documentId || !commenterName || !commenterEmail || !commenterPhone ||
        !idType || !idNumber || !stakeholderType || !commentData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: ['documentId', 'commenterName', 'commenterEmail', 'commenterPhone', 'idType', 'idNumber', 'stakeholderType', 'commentData']
      });
    }

<<<<<<< HEAD
    // ML enrichment (optional) — ML metadata set kare
    let predictedSentiment = sentiment || null;
    let predictedSummary = summary || null;

    const mlUrl = process.env.ML_API_URL;
    if (mlUrl && commentData && (!predictedSentiment || !predictedSummary)) {
      try {
        const mlResp = await fetch(mlUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: commentData, documentId, section })
        });
        if (mlResp.ok) {
          const mlJson = await mlResp.json();
          if (!predictedSentiment && mlJson.sentiment) predictedSentiment = mlJson.sentiment;
          if (!predictedSummary && mlJson.summary) predictedSummary = mlJson.summary;
        } else {
          console.warn('ML API responded with status', mlResp.status);
        }
      } catch (e) {
        console.error('Error calling ML API:', e.message || e);
      }
=======
    // Initialize sentiment analysis results with defaults
    let predictedSentiment = sentiment || 'neutral';
    let predictedSummary = summary || null;
    let confidence = 0.0;
    let strongOpinion = false;
    let keywords = [];

    // Call FastAPI sentiment analysis service
    const fastApiUrl = process.env.FASTAPI_URL || 'http://127.0.0.1:8001';

    try {
      const sentimentResp = await fetch(`${fastApiUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentData })
      });

      if (sentimentResp.ok) {
        const sentimentData = await sentimentResp.json();
        // Map FastAPI response to our fields
        predictedSentiment = sentimentData.sentiment || 'neutral';
        confidence = sentimentData.confidence || 0.0;
        strongOpinion = sentimentData.strong_opinion || false;
        keywords = sentimentData.keywords || [];

        // Use processed_text as summary if available
        if (sentimentData.processed_text) {
          predictedSummary = sentimentData.processed_text;
        }

        console.log(`Sentiment analysis: ${predictedSentiment} (${(confidence * 100).toFixed(1)}%)`);
      } else {
        console.warn('FastAPI sentiment service responded with status', sentimentResp.status);
        // Fallback to neutral
        predictedSentiment = 'neutral';
        confidence = 0.0;
      }
    } catch (e) {
      console.error('Error calling FastAPI sentiment service:', e.message || e);
      // Fallback if FastAPI not reachable
      predictedSentiment = 'neutral';
      confidence = 0.0;
      strongOpinion = false;
      keywords = [];
>>>>>>> 1450b5da7249fafe8c4969259a9e799d9158605f
    }

    const values = [
      documentId,
      section || null,
      commentData,
<<<<<<< HEAD
      predictedSentiment || null,
      predictedSummary || null,
=======
      predictedSentiment,
      predictedSummary,
>>>>>>> 1450b5da7249fafe8c4969259a9e799d9158605f
      supportedDocData || null,
      supportedDocFilename || null,
      commenterName,
      commenterEmail,
      commenterPhone,
      commenterAddress || null,
      idType,
      idNumber,
<<<<<<< HEAD
      stakeholderType
=======
      stakeholderType,
      confidence,
      strongOpinion,
      JSON.stringify(keywords)
>>>>>>> 1450b5da7249fafe8c4969259a9e799d9158605f
    ];

    const result = await commentsModel.insertComment(values);

<<<<<<< HEAD
    res.status(201).json({ success: true, message: 'Comment submitted successfully', data: result });
=======
    // Return sentiment data in response for frontend display
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
>>>>>>> 1450b5da7249fafe8c4969259a9e799d9158605f
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
      return res.status(400).json({ success: false, message: 'Comment ID and comment data are required' });
    }

    const updated = await commentsModel.updateComment(commentId, commentData, sentiment || null, summary || null);
    if (!updated) return res.status(404).json({ success: false, message: 'Comment not found' });
    res.status(200).json({ success: true, message: 'Comment updated successfully', data: updated });
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
