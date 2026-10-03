const commentModel = require('../models/comment.model');
const documentModel = require('../models/document.model');
const { OTP_ENABLED, verifyOtp } = require('../services/otp.service');
const { analyzeSentiment } = require('../services/sentiment.service');
const { maskKeepLast4 } = require('../utils/mask');

// Form ke keys -> analytics me dikhne wale labels
const STAKEHOLDER_LABELS = {
  individual: 'Individual',
  ngo: 'NGO',
  industry: 'Industry Body',
  law: 'Law Firm',
  consulting: 'Consulting Firm'
};

// "section1" / "section 2" -> "Section 2" (admin section-wise analysis isi format pe filter karta hai)
const normalizeSection = (value) => {
  if (!value) return null;
  const match = String(value).trim().match(/^section\s*(\d+)$/i);
  return match ? `Section ${match[1]}` : String(value).trim() || null;
};

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

    if (!(await documentModel.isOpen(documentId))) {
      return res.status(400).json({
        success: false,
        message: 'This consultation is closed or no longer available.'
      });
    }

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
      section: normalizeSection(section),
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
      stakeholderType: STAKEHOLDER_LABELS[stakeholderType] || stakeholderType,
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
