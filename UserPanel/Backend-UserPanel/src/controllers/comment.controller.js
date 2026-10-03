const commentModel = require('../models/comment.model');
const { OTP_ENABLED, verifyOtp } = require('../services/otp.service');
const { analyzeSentiment } = require('../services/sentiment.service');
const { maskKeepLast4 } = require('../utils/mask');

// POST /api/submit-comment
// Flow: OTP verify (agar enabled) -> ML sentiment -> DB insert (ID number masked)
async function submitComment(req, res, next) {
  try {
    const {
      documentId,
      section,
      commentData,
      commenterName,
      commenterEmail,
      commenterPhone,
      commenterAddress,
      idType,
      idNumber,
      stakeholderType,
      supportedDocFilename,
      otp
    } = req.body;

    if (OTP_ENABLED && !(await verifyOtp(commenterPhone, otp))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please try again or request a new OTP.'
      });
    }

    // Sentiment hamesha server-side model se aata hai, client ki value pe trust nahi karte
    const analysis = await analyzeSentiment(commentData);

    const { comments_id: commentId } = await commentModel.insertComment({
      documentId,
      section: section || null,
      commentData,
      sentiment: analysis.sentiment,
      summary: analysis.summary,
      supportedDocFilename: supportedDocFilename || null,
      commenterName,
      commenterEmail,
      commenterPhone,
      commenterAddress: commenterAddress || null,
      idType,
      idNumber: maskKeepLast4(idNumber),
      stakeholderType,
      confidence: analysis.confidence,
      strongOpinion: analysis.strongOpinion,
      keywords: analysis.keywords
    });

    res.status(201).json({
      success: true,
      message: 'Comment submitted successfully',
      data: { commentId },
      sentiment: {
        sentiment: analysis.sentiment,
        confidence: analysis.confidence,
        strong_opinion: analysis.strongOpinion,
        keywords: analysis.keywords
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { submitComment };
