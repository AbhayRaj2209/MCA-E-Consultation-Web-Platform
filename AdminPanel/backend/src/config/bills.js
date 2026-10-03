// Each consultation (bill) has its own comments table: bill_1_comments, bill_2_comments, ...
// Table names cannot be SQL parameters, so only keys from this allow-list are ever interpolated.
const BILL_KEYS = ['bill_1', 'bill_2', 'bill_3'];

const isValidBill = (bill) => BILL_KEYS.includes(bill);
const billToDocumentId = (bill) => parseInt(bill.split('_')[1], 10);
const commentsTable = (bill) => `${bill}_comments`;

module.exports = { BILL_KEYS, isValidBill, billToDocumentId, commentsTable };
