const pool = require('../config/db');

// Saare bills ke comments ek hi `comments` table me (document_id se alag hote hain)
const insertQuery = `
  INSERT INTO comments (
    document_id, section, comment_data, sentiment, summary, confidence, strong_opinion, keywords,
    supported_doc_filename, commenter_name, commenter_email, commenter_phone, commenter_address,
    id_type, id_number, stakeholder_type
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
  RETURNING comments_id;
`;

// Parameterized query (SQL injection safe)
async function insertComment(c) {
  const result = await pool.query(insertQuery, [
    c.documentId,
    c.section,
    c.commentData,
    c.sentiment,
    c.summary,
    c.confidence,
    c.strongOpinion,
    JSON.stringify(c.keywords),
    c.supportedDocFilename,
    c.commenterName,
    c.commenterEmail,
    c.commenterPhone,
    c.commenterAddress,
    c.idType,
    c.idNumber,
    c.stakeholderType
  ]);
  return result.rows[0];
}

module.exports = { insertComment };
