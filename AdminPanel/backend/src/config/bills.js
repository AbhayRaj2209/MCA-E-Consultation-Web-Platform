// Frontend bills ko "bill_<document_id>" key se refer karta hai (e.g. bill_1, bill_12).
// Sab comments ek hi `comments` table me hain, document_id se filtered.
const parseBill = (bill) => {
  const match = /^bill_(\d+)$/.exec(String(bill || ''));
  const id = match ? parseInt(match[1], 10) : NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
};

const billKey = (documentId) => `bill_${documentId}`;

module.exports = { parseBill, billKey };
