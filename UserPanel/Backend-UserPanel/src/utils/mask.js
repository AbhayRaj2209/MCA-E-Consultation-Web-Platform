// Sirf last 4 characters dikhata hai, baaki 'X' (e.g. Aadhaar 123456789012 -> XXXXXXXX9012)
const maskKeepLast4 = (value) => {
  if (!value) return value;
  const str = String(value);
  return 'X'.repeat(Math.max(0, str.length - 4)) + str.slice(-4);
};

// Logs ke liye phone mask: 9876543210 -> ******3210
const maskPhone = (phone) => `******${String(phone).slice(-4)}`;

module.exports = { maskKeepLast4, maskPhone };
