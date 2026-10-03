// Stakeholder labels ek hi format me store hote hain taaki analytics me groups split na hon
const STAKEHOLDER_LABELS = {
  individual: 'Individual',
  ngo: 'NGO',
  industry: 'Industry Body',
  'industry body': 'Industry Body',
  law: 'Law Firm',
  'law firm': 'Law Firm',
  consulting: 'Consulting Firm',
  'consulting firm': 'Consulting Firm',
  nri: 'NRI'
};

const normalizeStakeholder = (value) => {
  if (!value) return 'Individual';
  const trimmed = String(value).trim();
  return STAKEHOLDER_LABELS[trimmed.toLowerCase()] || trimmed;
};

// "section1", "section 2", "SECTION 3" -> "Section 1"
const normalizeSection = (value) => {
  if (!value) return null;
  const match = String(value).trim().match(/^section\s*(\d+)$/i);
  return match ? `Section ${match[1]}` : String(value).trim() || null;
};

// Sirf last 4 characters dikhte hain (e.g. Aadhaar 123456789012 -> XXXXXXXX9012)
const maskKeepLast4 = (value) => {
  if (!value) return value;
  const str = String(value);
  if (/^X+/.test(str)) return str;
  return 'X'.repeat(Math.max(0, str.length - 4)) + str.slice(-4);
};

module.exports = { normalizeStakeholder, normalizeSection, maskKeepLast4 };
