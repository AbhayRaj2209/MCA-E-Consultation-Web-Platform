import { API_BASE_URL } from "@/config/constants";

// All backend calls live here so components only deal with UI state.
// Each call resolves to { ok, status, data } and never throws on HTTP errors.
async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Accept: "application/json", ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok && data.success !== false, status: response.status, data };
}

export const sendOtp = (phone) =>
  request("/api/otp/send", { method: "POST", body: JSON.stringify({ phone }) });

export const submitComment = (payload) =>
  request("/api/submit-comment", { method: "POST", body: JSON.stringify(payload) });

// Open (non-archived) consultations published from the admin panel
export const fetchDocuments = () => request("/api/documents", { cache: "no-store" });

export const fetchDocument = (documentId) => request(`/api/documents/${documentId}`, { cache: "no-store" });

export const attachmentUrl = (documentId) => `${API_BASE_URL}/api/documents/${documentId}/attachment`;

export const fetchDocumentSummary = (documentId, lang) =>
  request(`/api/documents/${documentId}/summary?lang=${encodeURIComponent(lang)}`, { cache: "no-store" });

// Backend relative paths (e.g. audio proxy "/api/...") ko full URL banata hai
export const resolveApiUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("/api")) return `${API_BASE_URL}${url}`;
  return url;
};
