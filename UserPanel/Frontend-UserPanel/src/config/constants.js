// Backend base URL (set VITE_API_URL in .env / hosting dashboard)
export const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

// OTP step on/off (backend me OTP_ENABLED bhi same rakhein)
export const OTP_ENABLED = import.meta.env.VITE_OTP_ENABLED === "true";

// Served from /public so it works the same in dev and production builds
export const GOI_LOGO = "/goi-logo.png";
