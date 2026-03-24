const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Security Guardrails Helper
function validateInput(text) {
  if (!text) return { isValid: false, error: 'Input is empty' };

  // 1. Length Limit (e.g., 3000 chars)
  if (text.length > 3000) {
    return { isValid: false, error: 'Input exceeds maximum length of 3000 characters.' };
  }

  // 2. Jailbreak / Injection Keywords
  const forbiddenPatterns = [
    /ignore previous instructions/i,
    /system override/i,
    /dan mode/i,
    /reset system/i,
    /reveal system prompt/i
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) {
      console.warn(`[SECURITY] Blocked input containing forbidden pattern: ${pattern}`);
      return { isValid: false, error: 'Input contains forbidden keywords.' };
    }
  }

  return { isValid: true };
}

// Get recent activity from all bills
app.get('/api/recent-activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const query = `
      SELECT 'bill_1' as bill, comments_id as id, commenter_name, comment_data, sentiment, stakeholder_type, created_at 
      FROM bill_1_comments
      UNION ALL
      SELECT 'bill_2' as bill, comments_id, commenter_name, comment_data, sentiment, stakeholder_type, created_at 
      FROM bill_2_comments
      UNION ALL
      SELECT 'bill_3' as bill, comments_id, commenter_name, comment_data, sentiment, stakeholder_type, created_at 
      FROM bill_3_comments
      ORDER BY created_at DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching recent activity:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Get comments for specific bill
app.get('/api/comments/:bill', async (req, res) => {
  try {
    const { bill } = req.params;
    const limit = parseInt(req.query.limit) || 1000; // Increased default limit to fetch all comments

    if (!['bill_1', 'bill_2', 'bill_3'].includes(bill)) {
      return res.status(400).json({ ok: false, error: 'Invalid bill name' });
    }

    const result = await pool.query(
      `SELECT * FROM ${bill}_comments ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );

    res.json({ ok: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Add new comment
app.post('/api/comments/:bill', async (req, res) => {
  try {
    const { bill } = req.params;
    const { commenter_name, comment_data, stakeholder_type } = req.body;

    if (!['bill_1', 'bill_2', 'bill_3'].includes(bill)) {
      return res.status(400).json({ ok: false, error: 'Invalid bill name' });
    }

    if (!commenter_name || !comment_data) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    // Security Validation
    const validation = validateInput(comment_data);
    if (!validation.isValid) {
      return res.status(400).json({ ok: false, error: validation.error });
    }

    // Map bill to document_id
    const billMap = { 'bill_1': 1, 'bill_2': 2, 'bill_3': 3 };
    const documentId = billMap[bill];

    // Default values
    let sentiment = 'neutral';
    let confidence = 0.0;
    let strongOpinion = false;
    let keywords = [];
    let summary = null;

    // Call FastAPI for Sentiment Analysis
    const fastApiUrl = process.env.FASTAPI_URL || 'http://127.0.0.1:8001';
    try {
      const sentimentResponse = await fetch(`${fastApiUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: comment_data })
      });

      if (sentimentResponse.ok) {
        const data = await sentimentResponse.json();
        // Map response fields
        sentiment = data.sentiment || 'neutral';
        confidence = data.confidence || 0.0;
        strongOpinion = data.strong_opinion || false;
        keywords = data.keywords || [];
        if (data.processed_text) {
          summary = data.processed_text;
        }

        // Validate sentiment value
        const validSentiments = ['positive', 'negative', 'neutral'];
        if (!validSentiments.includes(sentiment.toLowerCase())) {
          console.warn(`[SECURITY] Invalid sentiment received from model: ${sentiment}. Defaulting to neutral.`);
          sentiment = 'neutral';
        }

        console.log(`Sentiment analysis: ${sentiment} (${(confidence * 100).toFixed(1)}%)`);
      } else {
        const errorText = await sentimentResponse.text();
        console.warn('FastAPI service returned non-OK status:', sentimentResponse.status, errorText);
      }
    } catch (e) {
      console.error('Failed to fetch sentiment:', e.message);
      // Fallback to defaults
      sentiment = 'neutral';
      confidence = 0.0;
    }

    const result = await pool.query(
      `INSERT INTO ${bill}_comments
       (commenter_name, comment_data, sentiment, stakeholder_type, document_id, confidence, strong_opinion, keywords, summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [commenter_name, comment_data, sentiment, stakeholder_type || 'Individual', documentId, confidence, strongOpinion, JSON.stringify(keywords), summary]
    );

    res.status(201).json({ ok: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Unified User Panel Submission Endpoint
app.post('/api/submit-comment', async (req, res) => {
  try {
    const {
      documentId,
      section,
      commentData,
      sentiment: userSentiment, // User might send null
      summary: userSummary,     // User might send null
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

    if (!documentId || !commentData) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Security Validation
    const validation = validateInput(commentData);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    // Dynamic Table Selection
    const tableMap = { 1: 'bill_1_comments', 2: 'bill_2_comments', 3: 'bill_3_comments' };
    const tableName = tableMap[documentId];
    if (!tableName) {
      return res.status(400).json({ success: false, message: 'Invalid Document ID' });
    }

    // AI Enrichment - Default values
    let sentiment = userSentiment || 'neutral';
    let summary = userSummary || null;
    let confidence = 0.0;
    let strongOpinion = false;
    let keywords = [];

    // Call FastAPI Sentiment Analysis Service
    const fastApiUrl = process.env.FASTAPI_URL || 'http://127.0.0.1:8001';
    try {
      const sentimentResponse = await fetch(`${fastApiUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentData })
      });

      if (sentimentResponse.ok) {
        const data = await sentimentResponse.json();
        // Map response fields
        sentiment = data.sentiment || 'neutral';
        confidence = data.confidence || 0.0;
        strongOpinion = data.strong_opinion || false;
        keywords = data.keywords || [];
        if (data.processed_text && !summary) {
          summary = data.processed_text;
        }

        // Validate sentiment value
        const validSentiments = ['positive', 'negative', 'neutral'];
        if (!validSentiments.includes(sentiment.toLowerCase())) {
          console.warn(`[SECURITY] Invalid sentiment received from model: ${sentiment}. Defaulting to neutral.`);
          sentiment = 'neutral';
        }

        console.log(`Sentiment analysis: ${sentiment} (${(confidence * 100).toFixed(1)}%)`);
      }
    } catch (e) {
      console.error('AI Enrichment Failed:', e.message);
      // Fallback to defaults
      sentiment = 'neutral';
      confidence = 0.0;
    }

    // Insert into DB
    const query = `
      INSERT INTO ${tableName} (
        document_id, section, comment_data, sentiment, summary, confidence, strong_opinion, keywords,
        supported_doc, supported_doc_filename,
        commenter_name, commenter_email, commenter_phone, commenter_address,
        id_type, id_number, stakeholder_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;

    const values = [
      documentId, section || null, commentData, sentiment, summary, confidence, strongOpinion, JSON.stringify(keywords),
      supportedDocData || null, supportedDocFilename || null,
      commenterName, commenterEmail, commenterPhone, commenterAddress || null,
      idType, idNumber, stakeholderType
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Comment submitted successfully',
      data: result.rows[0],
      sentiment: {
        sentiment: sentiment,
        confidence: confidence,
        strong_opinion: strongOpinion,
        keywords: keywords
      }
    });

  } catch (err) {
    console.error('Error submitting comment:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Generate Overview (Dynamic Summary)
app.post('/api/generate-overview/:bill', async (req, res) => {
  try {
    const { bill } = req.params;
    const { type, section } = req.body; // type: 'overall'|'positive'|'negative', section: 'Section 1'|'Section 2'|'Section 3'

    // Map bill to document_id
    const billMap = { 'bill_1': 1, 'bill_2': 2, 'bill_3': 3 };
    const documentId = billMap[bill];
    if (!documentId) return res.status(400).json({ ok: false, error: 'Invalid bill ID' });

    // 1. Fetch relevant comments
    let query = `SELECT comment_data, summary, sentiment, section FROM ${bill}_comments`;
    const queryParams = [];

    // If section is specified, filter by it
    if (section) {
      query += ` WHERE section = $1`;
      queryParams.push(section);
    }

    const result = await pool.query(query, queryParams);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.json({ ok: true, message: 'No comments to summarize.' });
    }

    // 2. Group comments
    const allComments = [];
    const positiveComments = [];
    const negativeComments = [];

    rows.forEach(r => {
      const text = r.summary || r.comment_data;
      if (text) {
        allComments.push(text);
        const s = (r.sentiment || '').toLowerCase();
        if (s === 'positive') positiveComments.push(text);
        if (s === 'negative') negativeComments.push(text);
      }
    });

    // Helper to call Group Summary API
    async function getGroupSummary(commentsArray) {
      if (commentsArray.length === 0) return null;
      try {
        const response = await fetch('http://192.168.1.53:8364/api/summarize_group', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comments: commentsArray })
        });
        if (response.ok) {
          const data = await response.json();
          return data.final_summary || data.summary || (data.summaries ? data.summaries[0] : null);
        } else {
          console.warn('Group Summary API failed:', response.status);
          return null;
        }
      } catch (e) {
        console.error('Group Summary Error:', e.message);
        return null;
      }
    }

    // 3. Generate Summaries based on type
    // If section IS provided, we update section columns
    // If section IS NOT provided, we update global columns

    let overallSum = null;
    let posSum = null;
    let negSum = null;

    if (!type || type === 'overall') {
      overallSum = await getGroupSummary(allComments);
    }
    if (!type || type === 'positive') {
      posSum = await getGroupSummary(positiveComments);
    }
    if (!type || type === 'negative') {
      negSum = await getGroupSummary(negativeComments);
    }

    // 4. Update Documents Table
    if (section) {
      // Determine column names based on section string 'Section 1', 'Section 2', 'Section 3'
      let overallCol, posCol, negCol;

      if (section === 'Section 1') {
        overallCol = 'section_1_summary';
        posCol = 'section1_positive';
        negCol = 'section1_negative';
      } else if (section === 'Section 2') {
        overallCol = 'section_2_summary';
        posCol = 'section2_positive';
        negCol = 'section2_negative';
      } else if (section === 'Section 3') {
        overallCol = 'section_3_summary';
        posCol = 'section3_positive';
        negCol = 'section3_negative';
      } else {
        return res.status(400).json({ ok: false, error: "Invalid section name" });
      }

      // Construct dynamic update query
      // We only update the columns that correspond to the requested 'type'
      // timestamps update is good practice

      const updates = [];
      const values = [];
      let idx = 1;

      if ((!type || type === 'overall') && overallSum) {
        updates.push(`${overallCol} = $${idx++}`);
        values.push(overallSum);
      }
      if ((!type || type === 'positive') && posSum) {
        updates.push(`${posCol} = $${idx++}`);
        values.push(posSum);
      }
      if ((!type || type === 'negative') && negSum) {
        updates.push(`${negCol} = $${idx++}`);
        values.push(negSum);
      }

      if (updates.length > 0) {
        updates.push(`updated_at = NOW()`);
        values.push(documentId);
        const updateQuery = `UPDATE documents SET ${updates.join(', ')} WHERE document_id = $${idx}`;
        await pool.query(updateQuery, values);
      }

    } else {
      // Global Update (existing logic)
      await pool.query(
        `UPDATE documents 
         SET summary = COALESCE($1, summary), 
             positive_summary = COALESCE($2, positive_summary), 
             negative_summary = COALESCE($3, negative_summary),
             updated_at = NOW()
         WHERE document_id = $4`,
        [overallSum, posSum, negSum, documentId]
      );
    }

    res.json({
      ok: true,
      data: { overall: overallSum, positive: posSum, negative: negSum }
    });

  } catch (err) {
    console.error('Error generating overview:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Get sentiment summary for a bill
app.get('/api/sentiment/:bill', async (req, res) => {
  try {
    const { bill } = req.params;

    if (!['bill_1', 'bill_2', 'bill_3'].includes(bill)) {
      return res.status(400).json({ ok: false, error: 'Invalid bill name' });
    }

    const result = await pool.query(
      `SELECT sentiment, COUNT(*) as count FROM ${bill}_comments GROUP BY sentiment ORDER BY count DESC`
    );

    res.json({ ok: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching sentiment:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Get sentiment summaries from documents table for a specific bill
app.get('/api/summaries/:bill', async (req, res) => {
  try {
    const { bill } = req.params;

    if (!['bill_1', 'bill_2', 'bill_3'].includes(bill)) {
      return res.status(400).json({ ok: false, error: 'Invalid bill name' });
    }

    // Map bill_1 -> document_id 1, bill_2 -> 2, bill_3 -> 3
    const documentId = parseInt(bill.split('_')[1]);

    // Query the documents table using document_id
    const result = await pool.query(
      `SELECT summary, positive_summary, negative_summary 
       FROM documents 
       WHERE document_id = $1 
       LIMIT 1`,
      [documentId]
    );

    if (result.rows.length === 0) {
      return res.json({
        ok: true,
        data: {
          overall_summary: null,
          positive_summary: null,
          negative_summary: null
        }
      });
    }

    const row = result.rows[0];

    res.json({
      ok: true,
      data: {
        overall_summary: row.summary || null,
        positive_summary: row.positive_summary || null,
        negative_summary: row.negative_summary || null
      }
    });
  } catch (err) {
    console.error('Error fetching summaries:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Get section-wise summaries from documents table for a specific bill
app.get('/api/sections/:bill', async (req, res) => {
  try {
    const { bill } = req.params;

    if (!['bill_1', 'bill_2', 'bill_3'].includes(bill)) {
      return res.status(400).json({ ok: false, error: 'Invalid bill name' });
    }

    // Map bill_1 -> document_id 1, bill_2 -> 2, bill_3 -> 3
    const documentId = parseInt(bill.split('_')[1]);

    // Query the documents table for section summaries
    const result = await pool.query(
      `SELECT section_1_summary, section_2_summary, section_3_summary 
       FROM documents 
       WHERE document_id = $1 
       LIMIT 1`,
      [documentId]
    );

    if (result.rows.length === 0) {
      return res.json({
        ok: true,
        data: {
          section_1: null,
          section_2: null,
          section_3: null
        }
      });
    }

    const row = result.rows[0];

    res.json({
      ok: true,
      data: {
        section_1: row.section_1_summary || null,
        section_2: row.section_2_summary || null,
        section_3: row.section_3_summary || null
      }
    });
  } catch (err) {
    console.error('Error fetching section summaries:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Get section-wise sentiment summaries (positive/negative) from documents table for a specific bill
app.get('/api/section-sentiments/:bill', async (req, res) => {
  try {
    const { bill } = req.params;

    if (!['bill_1', 'bill_2', 'bill_3'].includes(bill)) {
      return res.status(400).json({ ok: false, error: 'Invalid bill name' });
    }

    // Map bill_1 -> document_id 1, bill_2 -> 2, bill_3 -> 3
    const documentId = parseInt(bill.split('_')[1]);

    // Query the documents table for positive and negative summaries for all sections
    const result = await pool.query(
      `SELECT 
         section1_positive, section1_negative,
         section2_positive, section2_negative,
         section3_positive, section3_negative
       FROM documents 
       WHERE document_id = $1 
       LIMIT 1`,
      [documentId]
    );

    if (result.rows.length === 0) {
      return res.json({ ok: true, data: null });
    }

    const row = result.rows[0];

    res.json({
      ok: true,
      data: {
        section1: {
          positive: row.section1_positive || null,
          negative: row.section1_negative || null
        },
        section2: {
          positive: row.section2_positive || null,
          negative: row.section2_negative || null
        },
        section3: {
          positive: row.section3_positive || null,
          negative: row.section3_negative || null
        }
      }
    });
  } catch (err) {
    console.error('Error fetching section sentiment summaries:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Admin API: Get all comments with sentiment analysis details and counts
app.get('/api/admin/comments', async (req, res) => {
  try {
    const { bill } = req.query; // Optional bill filter: bill_1, bill_2, bill_3
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    let comments = [];
    let sentimentCounts = { positive: 0, negative: 0, neutral: 0 };

    if (bill) {
      // Single bill query
      if (!['bill_1', 'bill_2', 'bill_3'].includes(bill)) {
        return res.status(400).json({ ok: false, error: 'Invalid bill name' });
      }

      // Get comments with sentiment details
      const commentsResult = await pool.query(
        `SELECT
          comments_id as id,
          comment_data as text,
          sentiment,
          confidence,
          strong_opinion,
          keywords,
          commenter_name,
          stakeholder_type,
          section,
          created_at
        FROM ${bill}_comments
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      comments = commentsResult.rows;

      // Get sentiment counts
      const countsResult = await pool.query(
        `SELECT
          LOWER(COALESCE(sentiment, 'neutral')) as sentiment_type,
          COUNT(*)::int as count
        FROM ${bill}_comments
        GROUP BY LOWER(COALESCE(sentiment, 'neutral'))`
      );

      countsResult.rows.forEach(row => {
        if (row.sentiment_type === 'positive') sentimentCounts.positive = row.count;
        else if (row.sentiment_type === 'negative') sentimentCounts.negative = row.count;
        else sentimentCounts.neutral = row.count;
      });

    } else {
      // Aggregate from all bills
      const aggregateQuery = `
        SELECT
          'bill_1' as bill,
          comments_id as id,
          comment_data as text,
          sentiment,
          confidence,
          strong_opinion,
          keywords,
          commenter_name,
          stakeholder_type,
          section,
          created_at
        FROM bill_1_comments
        UNION ALL
        SELECT
          'bill_2' as bill,
          comments_id,
          comment_data,
          sentiment,
          confidence,
          strong_opinion,
          keywords,
          commenter_name,
          stakeholder_type,
          section,
          created_at
        FROM bill_2_comments
        UNION ALL
        SELECT
          'bill_3' as bill,
          comments_id,
          comment_data,
          sentiment,
          confidence,
          strong_opinion,
          keywords,
          commenter_name,
          stakeholder_type,
          section,
          created_at
        FROM bill_3_comments
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const commentsResult = await pool.query(aggregateQuery, [limit, offset]);
      comments = commentsResult.rows;

      // Get sentiment counts from all bills
      const countsQuery = `
        SELECT sentiment_type, SUM(count)::int as count FROM (
          SELECT LOWER(COALESCE(sentiment, 'neutral')) as sentiment_type, COUNT(*) as count
          FROM bill_1_comments GROUP BY LOWER(COALESCE(sentiment, 'neutral'))
          UNION ALL
          SELECT LOWER(COALESCE(sentiment, 'neutral')) as sentiment_type, COUNT(*) as count
          FROM bill_2_comments GROUP BY LOWER(COALESCE(sentiment, 'neutral'))
          UNION ALL
          SELECT LOWER(COALESCE(sentiment, 'neutral')) as sentiment_type, COUNT(*) as count
          FROM bill_3_comments GROUP BY LOWER(COALESCE(sentiment, 'neutral'))
        ) combined
        GROUP BY sentiment_type
      `;

      const countsResult = await pool.query(countsQuery);
      countsResult.rows.forEach(row => {
        if (row.sentiment_type === 'positive') sentimentCounts.positive = row.count;
        else if (row.sentiment_type === 'negative') sentimentCounts.negative = row.count;
        else sentimentCounts.neutral = row.count;
      });
    }

    // Parse keywords JSON for each comment
    comments = comments.map(comment => ({
      ...comment,
      keywords: comment.keywords ? (typeof comment.keywords === 'string' ? JSON.parse(comment.keywords) : comment.keywords) : []
    }));

    const total = sentimentCounts.positive + sentimentCounts.negative + sentimentCounts.neutral;

    res.json({
      ok: true,
      data: {
        comments,
        sentimentCounts,
        total,
        pagination: { limit, offset }
      }
    });
  } catch (err) {
    console.error('Error fetching admin comments:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Get consultations metadata (titles, description, dates, status) + submissions count
app.get('/api/consultations', async (req, res) => {
  try {
    const bills = [
      {
        id: 1,
        bill_key: 'bill_1',
        title: 'Establishment of Indian Multi-Disciplinary Partnership (MDP) firms by the Govt. of India',
        status: 'In Progress',
        endDate: '2025-10-10',
        description: 'New guidelines for CSR implementation and reporting',
        publishDate: '2025-09-01'
      },
      {
        id: 2,
        bill_key: 'bill_2',
        title: 'Digital Competition Bill, 2025',
        status: 'Completed',
        endDate: '2025-08-31',
        description: 'Proposed amendments to strengthen corporate governance and transparency',
        publishDate: '2025-07-15'
      },
      {
        id: 3,
        bill_key: 'bill_3',
        title: 'Companies Amendment Bill, 2025',
        status: 'Completed',
        endDate: '2025-07-15',
        description: 'Amendments to improve the insolvency resolution process',
        publishDate: '2025-06-01'
      }
    ];

    // For each bill, query count of comments
    const results = [];
    for (const b of bills) {
      const countQuery = `SELECT COUNT(*)::int AS count FROM ${b.bill_key}_comments`;
      let count = 0;
      try {
        const r = await pool.query(countQuery);
        count = r.rows[0]?.count || 0;
      } catch (e) {
        // If table doesn't exist or error, treat as zero and continue
        console.warn(`Could not get count for ${b.bill_key}:`, e.message || e);
        count = 0;
      }

      results.push({
        id: b.id,
        bill: b.bill_key,
        title: b.title,
        status: b.status,
        submissions: count,
        endDate: b.endDate,
        description: b.description,
        publishDate: b.publishDate
      });
    }

    res.json({ ok: true, data: results });
  } catch (err) {
    console.error('Error fetching consultations:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Server running on http://localhost:${PORT}\n`);
  console.log('Available endpoints:');

  console.log('  GET  /api/comments/:bill');
  console.log('  POST /api/comments/:bill');
  console.log('  GET  /api/admin/comments');
  console.log('  GET  /api/sentiment/:bill');
  console.log('  GET  /api/summaries/:bill');
  console.log('  GET  /api/sections/:bill');
  console.log('  GET  /api/section-sentiments/:bill\n');
});
