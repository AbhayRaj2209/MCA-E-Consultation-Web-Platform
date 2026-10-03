const pool = require('../config/db');

const insertQuery = `
  INSERT INTO bill_1_comments (
    document_id,
    section,
    comment_data,
    sentiment,
    summary,
    supported_doc,
    supported_doc_filename,
    commenter_name,
    commenter_email,
    commenter_phone,
    commenter_address,
    id_type,
    id_number,
    stakeholder_type,
    confidence,
    strong_opinion,
    keywords,
    created_at,
    updated_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
  RETURNING comments_id;
`;

// Parameterized query (SQL injection safe)
async function insertComment(c) {
  const values = [
    c.documentId,
    c.section,
    c.commentData,
    c.sentiment,
    c.summary,
    null, // supported_doc: file upload abhi enabled nahi hai
    c.supportedDocFilename,
    c.commenterName,
    c.commenterEmail,
    c.commenterPhone,
    c.commenterAddress,
    c.idType,
    c.idNumber,
    c.stakeholderType,
    c.confidence,
    c.strongOpinion,
    JSON.stringify(c.keywords)
  ];
  const result = await pool.query(insertQuery, values);
  return result.rows[0];
}

module.exports = { insertComment };
