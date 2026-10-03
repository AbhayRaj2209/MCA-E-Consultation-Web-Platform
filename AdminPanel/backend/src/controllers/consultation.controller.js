const pool = require('../config/db');
const { isValidBill, commentsTable } = require('../config/bills');

// documents table khali/unavailable ho to purana static data dikhaya jaata hai
const DEFAULT_CONSULTATIONS = [
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

async function countSubmissions(billKey) {
  if (!isValidBill(billKey)) return 0;
  try {
    const r = await pool.query(`SELECT COUNT(*)::int AS count FROM ${commentsTable(billKey)}`);
    return r.rows[0]?.count || 0;
  } catch (e) {
    console.warn(`Could not get count for ${billKey}:`, e.message || e);
    return 0;
  }
}

async function getDefaultConsultations() {
  return Promise.all(DEFAULT_CONSULTATIONS.map(async (b) => ({
    ...b,
    submissions: await countSubmissions(b.bill_key)
  })));
}

const toDateString = (d) => (d ? d.toISOString().split('T')[0] : null);

// GET /api/consultations  -> documents table + submissions count per bill
async function getConsultations(req, res, next) {
  try {
    const docResult = await pool.query(
      `SELECT document_id, type_of_document, type_of_act, posted_on, comments_due_date, document_name,
              summary, positive_summary, negative_summary, created_at
       FROM documents
       ORDER BY created_at DESC`
    );

    if (docResult.rows.length === 0) {
      return res.json({ ok: true, data: await getDefaultConsultations() });
    }

    const consultations = await Promise.all(docResult.rows.map(async (doc) => {
      const billKey = `bill_${doc.document_id}`;
      const status = doc.comments_due_date
        ? (new Date(doc.comments_due_date) >= new Date() ? 'In Progress' : 'Completed')
        : 'Draft';

      return {
        id: doc.document_id,
        bill_key: billKey,
        title: doc.document_name,
        status,
        endDate: toDateString(doc.comments_due_date),
        description: doc.type_of_act || doc.summary || null,
        publishDate: toDateString(doc.posted_on),
        submissions: await countSubmissions(billKey),
        summary: doc.summary || null,
        created_at: doc.created_at
      };
    }));

    res.json({ ok: true, data: consultations });
  } catch (err) {
    console.error('Error fetching consultations:', err);
    try {
      res.json({ ok: true, data: await getDefaultConsultations() });
    } catch (fallbackErr) {
      next(err);
    }
  }
}

module.exports = { getConsultations };
