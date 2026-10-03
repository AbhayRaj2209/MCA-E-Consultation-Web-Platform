// Comment text ke liye guardrails: length limit + prompt-injection jaise patterns block
const MAX_LENGTH = 3000;
const FORBIDDEN_PATTERNS = [
  /ignore previous instructions/i,
  /system override/i,
  /dan mode/i,
  /reset system/i,
  /reveal system prompt/i
];

function validateInput(text) {
  if (!text) return { isValid: false, error: 'Input is empty' };

  if (text.length > MAX_LENGTH) {
    return { isValid: false, error: `Input exceeds maximum length of ${MAX_LENGTH} characters.` };
  }

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      console.warn(`[SECURITY] Blocked input containing forbidden pattern: ${pattern}`);
      return { isValid: false, error: 'Input contains forbidden keywords.' };
    }
  }

  return { isValid: true };
}

module.exports = { validateInput };
